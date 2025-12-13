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
  const { isLoading: authLoading, isAuthenticated, session } = useAuth();

  // 3. State for Remote Data (Source of Truth)
  const [remoteIncidents, setRemoteIncidents] = useState<Incident[]>([]);

  // 4. State for Local Data (Pending/Offline items)
  const localReports = useLiveQuery(() => db.reports.toArray()) ?? [];

  const canFetchRemote = !authLoading && isAuthenticated && Boolean(session);

  const mapRowToIncident = useCallback((row: any): Incident => ({
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
    status: row.status ?? "Active",
    reportedBy: row.reported_by ?? "Command Center",
  }), []);

  // 4. Fetch Trigger & Realtime Subscription
  useEffect(() => {
    if (!canFetchRemote) {
      return;
    }

    let isCancelled = false;
    let isFetching = false;
    const abortController = new AbortController();
    const FETCH_BASE_DELAY_MS = 1000;
    const FETCH_MAX_DELAY_MS = 60000;

    const waitWithAbort = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        if (abortController.signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }

        const timeoutId = setTimeout(() => {
          abortController.signal.removeEventListener('abort', onAbort);
          resolve();
        }, ms);

        const onAbort = () => {
          clearTimeout(timeoutId);
          abortController.signal.removeEventListener('abort', onAbort);
          reject(new DOMException('Aborted', 'AbortError'));
        };

        abortController.signal.addEventListener('abort', onAbort);
      });

    const fetchWithRetry = async () => {
      if (isFetching) {
        return;
      }

      isFetching = true;
      let attempt = 0;

      while (!isCancelled && !abortController.signal.aborted) {
        try {
          const { data, error } = await supabase
            .from('incidents')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          if (data) {
            const mappedRemote: Incident[] = data.map(mapRowToIncident);
            if (!isCancelled) {
              setRemoteIncidents(mappedRemote);
            }
            break;
          }
        } catch (err) {
          if (abortController.signal.aborted) {
            break;
          }

          const message = err instanceof Error ? err.message : 'Unknown Supabase error';
          console.warn("IncidentProvider fetch error", message);
          const backoffDelay = Math.min(FETCH_BASE_DELAY_MS * 2 ** attempt, FETCH_MAX_DELAY_MS);
          attempt += 1;
          try {
            await waitWithAbort(backoffDelay);
          } catch {
            break;
          }
          continue;
        }
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
                  status: 'Active',
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

      isFetching = false;
    };

    fetchWithRetry();

    const channel = supabase
      .channel('public:incidents')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          const newIncident = mapRowToIncident(payload.new);
          setRemoteIncidents((prev) => {
            const exists = prev.find((item) => item.id === newIncident.id);
            if (exists) {
              return prev.map((item) => (item.id === newIncident.id ? newIncident : item));
            }
            return [newIncident, ...prev];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          fetchWithRetry();
        }
      });

    return () => {
      isCancelled = true;
      abortController.abort();
      supabase.removeChannel(channel);
    };
  }, [canFetchRemote, mapRowToIncident]);

  // 5. Merge Logic (The Core Requirement)
    // B. Realtime Subscription
    // Attempting to re-enable Realtime. If this causes issues, it can be disabled.
    try {
      const channel = supabase
        .channel('public:incidents')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'incidents' },
          (payload) => {
            const newRow = payload.new as any;
            console.log("[IncidentProvider] Realtime Update Received:", newRow.id);

            const newIncident: Incident = {
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
              status: 'Active',
              reportedBy: "Realtime Update",
            };

            setRemoteIncidents((prev) => [newIncident, ...prev]);
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

  const value = useMemo(
    () => ({
      incidents,
      setIncidents,
      registerFieldIncident,
      resetToMock,
      sync
    }),
    [incidents, registerFieldIncident, resetToMock, sync],
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