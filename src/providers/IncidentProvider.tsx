import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import type { Incident, IncidentType } from "../types/incident";
import type { IncidentReport } from "../app/utils/storage";
import { useSyncManager } from "../app/hooks/useSyncManager";
import { db } from "../db/db";
import { storage } from "../app/utils/storage";
import { supabase } from "../supabaseClient";
// Import useAuth to access the session state
import { useAuth } from "./AuthProvider";

interface IncidentContextValue {
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  registerFieldIncident: (report: IncidentReport, reporterName?: string) => Incident;
  resetToMock: () => void;
  resolveIncident: (id: string) => Promise<void>;
  sync: () => Promise<void>;
}

const IncidentContext = createContext<IncidentContextValue | undefined>(undefined);

const FALLBACK_ADDRESS = "Awaiting verified address";

// Helper to map Local Dexie Report -> Incident
export const mapReportToIncident = (
  report: IncidentReport,
  reporterName?: string,
): Incident => {
  const timestampSource = report.timestamp ?? report.createdAt;

  return {
    id: `FIELD-${report.id}`,
    type: report.type,
    severity: report.severity,
    timestamp: new Date(timestampSource),
    location: {
      lat: report.location.latitude,
      lng: report.location.longitude,
      address: FALLBACK_ADDRESS,
    },
    description: "Field report pending command triage.",
    imageUrl: report.photo,
    status: report.status === "synced" ? "Responding" : "Active",
    reportedBy: reporterName ?? "Field Unit",
  };
};

export function IncidentProvider({ children }: { children: React.ReactNode }) {

  const { session, isLoading } = useAuth();

  // 2. Hook for background syncing (Dexie -> Supabase)
  const { sync } = useSyncManager();

  // 3. State for Remote Data (Source of Truth)
  const [remoteIncidents, setRemoteIncidents] = useState<Incident[]>([]);

  // 4. State for Local Data (Pending/Offline items)
  const localReports = useLiveQuery(() => db.reports.toArray()) ?? [];

  // 5. Fetch Trigger & Realtime Subscription
  useEffect(() => {
    let isMounted = true;
    if (isLoading) return;

    // A. Initial Fetch (Using Hybrid approach: Prefer Raw REST if SDK is unreliable)
    const fetchIncidents = async () => {
      console.log(`[IncidentProvider] Fetching... Session exists: ${!!session?.access_token}`);

      try {
        // 0. Ensure Supabase Client is Authenticated
        if (session?.access_token) {
          // SDK Fallback: Use Raw REST Fetch for reliable initial load
          // bypassing potential SDK WebSocket/Client state issues.
          const rawUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/incidents?select=*&order=created_at.desc`;

          try {
            console.log("[IncidentProvider] Attempting fetch via Supabase REST API...");
            const rawResponse = await fetch(rawUrl, {
              method: 'GET',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            });

            if (rawResponse.ok) {
              const rawData = await rawResponse.json();
              console.log(`[IncidentProvider] REST API Success. Loaded ${rawData.length} incidents.`);

              if (isMounted) {
                const mappedRemote: Incident[] = rawData.map((row: any) => ({
                  id: row.id,
                  type: row.incident_type as IncidentType,
                  severity: Number(row.severity) as 1 | 2 | 3 | 4 | 5,
                  timestamp: new Date(row.created_at),
                  location: {
                    lat: row.latitude,
                    lng: row.longitude,
                    address: row.address || FALLBACK_ADDRESS,
                  },
                  description: row.description || "Command Center Report",
                  imageUrl: row.image_url,
                  status: row.status as any, // Use mapped status from DB
                  reportedBy: "Command Center",
                }));
                setRemoteIncidents(mappedRemote);
                return; // Exit successfully
              }
            } else {
              console.warn(`[IncidentProvider] REST API Failed: ${rawResponse.status}`);
            }
          } catch (rawErr) {
            console.error("[IncidentProvider] REST API Error:", rawErr);
          }
        }

        // Fallback to SDK if REST failed (or if we decide to keep it as backup)
        // But since we know SDK hangs, we basically just log here or skip.
        // For now, we'll skip the hanging SDK query to avoid the timeout error log.
        console.warn("[IncidentProvider] SDK Fetch skipped (relied on REST API).");

      } catch (err) {
        console.error("[IncidentProvider] UNEXPECTED ERROR in fetchIncidents:", err);
      }
    };

    fetchIncidents();

    // B. Realtime Subscription
    // Attempting to re-enable Realtime. If this causes issues, it can be disabled.
    try {
      const channel = supabase
        .channel('public:incidents')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'incidents' },
          (payload) => {
            console.log(`[IncidentProvider] Realtime Event: ${payload.eventType}`);
            const newRow = payload.new as any;

            const mappedIncident: Incident = {
              id: newRow.id,
              type: newRow.incident_type as IncidentType,
              severity: Number(newRow.severity) as 1 | 2 | 3 | 4 | 5,
              timestamp: new Date(newRow.created_at),
              location: {
                lat: newRow.latitude,
                lng: newRow.longitude,
                address: newRow.address || FALLBACK_ADDRESS,
              },
              description: newRow.description || "Realtime Report",
              imageUrl: newRow.image_url,
              status: newRow.status as any,
              reportedBy: "Realtime Update",
            };

            setRemoteIncidents((prev) => {
              if (payload.eventType === 'INSERT') {
                return [mappedIncident, ...prev];
              } else if (payload.eventType === 'UPDATE') {
                return prev.map(inc => inc.id === mappedIncident.id ? mappedIncident : inc);
              }
              return prev;
            });
          }
        )
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    } catch (realtimeErr) {
      console.error("[IncidentProvider] Realtime Subscription Error:", realtimeErr);
      return () => { isMounted = false; };
    }

  }, [session?.access_token, isLoading]);

  // 6. Merge Logic
  const incidents = useMemo(() => {
    const merged = [...remoteIncidents];

    const unsyncedLocals = localReports.filter(
      (r) => r.status === 'local' || r.status === 'pending' || r.status === 'failed'
    );

    const mappedLocals = unsyncedLocals.map((r) =>
      mapReportToIncident(r, storage.getUser()?.name)
    );

    const all = [...mappedLocals, ...merged];

    return all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  }, [remoteIncidents, localReports]);

  // Debug: Log when context value changes
  useEffect(() => {
    // Keep this log for now to confirm stability to the user
    console.log("[IncidentProvider] Incidents state updated. Count:", incidents.length);
  }, [incidents]);

  const setIncidents: React.Dispatch<React.SetStateAction<Incident[]>> = useCallback(() => {
    console.warn("setIncidents is deprecated. Modify Supabase or Dexie directly.");
  }, []);

  const registerFieldIncident = useCallback(
    (report: IncidentReport, reporterName?: string) => {
      return mapReportToIncident(report, reporterName);
    },
    [],
  );

  const resetToMock = useCallback(() => {
  }, []);

  const resolveIncident = useCallback(async (id: string) => {
    // 1. Optimistic Update (UI updates immediately)
    setRemoteIncidents(prev => prev.map(inc =>
      inc.id === id ? { ...inc, status: 'Resolved' } : inc
    ));

    console.log(`[IncidentProvider] resolving incident ${id}. Using REST API fallback.`);

    try {
      if (!session?.access_token) {
        console.error("[IncidentProvider] Cannot resolve: No session token available.");
        // Revert optimistic update here if needed
        return;
      }

      // 2. Use Raw REST API for reliability (SDK has known issues in this env)
      const updateUrl = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/incidents?id=eq.${id}`;

      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation' // Ask for the updated row back
        },
        body: JSON.stringify({ status: 'Resolved' })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[IncidentProvider] REST Update Failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to update incident: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("[IncidentProvider] REST Update Success:", data);

      if (Array.isArray(data) && data.length === 0) {
        console.warn("[IncidentProvider] Update succeeded but returned no rows. Check RLS policies or ID.");
      }

    } catch (e: any) {
      console.error("[IncidentProvider] Error resolving incident:", e);
      // Optional: Revert optimistic update if API fails
      // setRemoteIncidents(prev => ... revert ... );
    }
  }, [session?.access_token]);

  const value = useMemo(
    () => ({
      incidents,
      setIncidents,
      registerFieldIncident,
      resetToMock,
      resolveIncident,
      sync
    }),
    [incidents, registerFieldIncident, resetToMock, resolveIncident, sync],
  );

  return <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>;
}

export function useIncidentData() {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncidentData must be used within an IncidentProvider");
  }
  return context;
}