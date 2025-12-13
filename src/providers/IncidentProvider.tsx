import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import type { Incident, IncidentType } from "../types/incident";
import type { IncidentReport } from "../app/utils/storage";
import { useSyncManager } from "../app/hooks/useSyncManager";
import { db } from "../db/db";
import { storage } from "../app/utils/storage";
import { supabase } from "../supabaseClient";

interface IncidentContextValue {
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  registerFieldIncident: (report: IncidentReport, reporterName?: string) => Incident;
  resetToMock: () => void;
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
  // 1. Hook for background syncing (Dexie -> Supabase)
  useSyncManager();

  // 2. State for Remote Data (Source of Truth)
  const [remoteIncidents, setRemoteIncidents] = useState<Incident[]>([]);

  // 3. State for Local Data (Pending/Offline items)
  // Directly query Dexie for all reports
  const localReports = useLiveQuery(() => db.reports.toArray()) ?? [];

  // 4. Fetch Trigger & Realtime Subscription
  useEffect(() => {
    // A. Initial Fetch
    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching incidents:", error);
      } else if (data) {
        const mappedRemote: Incident[] = data.map((row: any) => ({
          id: row.id, // UUID from Supabase
          type: row.incident_type as IncidentType,
          severity: Number(row.severity) as 1 | 2 | 3 | 4 | 5,
          timestamp: new Date(row.created_at), // Using created_at as primary timestamp
          location: {
            lat: row.latitude,
            lng: row.longitude,
            address: row.address || FALLBACK_ADDRESS,
          },
          description: row.description || "Command Center Report",
          imageUrl: row.image_url,
          status: 'Active', // Default status for remote items unless we fetch row.status
          reportedBy: "Command Center", // or row.reported_by if available
        }));
        setRemoteIncidents(mappedRemote);
      }
    };

    fetchIncidents();

    // B. Realtime Subscription
    const channel = supabase
      .channel('public:incidents')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          const newRow = payload.new as any;
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
      supabase.removeChannel(channel);
    };
  }, []);

  // 5. Merge Logic (The Core Requirement)
  const incidents = useMemo(() => {
    // Step A: Start with Remote Incidents
    const merged = [...remoteIncidents];

    // Step B: Filter Local Reports
    // ONLY include items that are NOT 'synced'.
    // If it's 'synced', it's already in the remoteIncidents list (fetched from Supabase).
    // Including it again would cause duplicates/double pins.
    const unsyncedLocals = localReports.filter(
      (r) => r.status === 'local' || r.status === 'pending' || r.status === 'failed'
    );

    // Step D: Map remaining local reports
    const mappedLocals = unsyncedLocals.map((r) =>
      mapReportToIncident(r, storage.getUser()?.name)
    );

    // Combine
    const all = [...mappedLocals, ...merged];

    // Step E: Sort by timestamp descending
    // (Ensure newest items, whether local or remote, are top)
    return all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  }, [remoteIncidents, localReports]);

  // Backward compatibility / No-op setters
  const setIncidents: React.Dispatch<React.SetStateAction<Incident[]>> = useCallback(() => {
    console.warn("setIncidents is deprecated. Modify Supabase or Dexie directly.");
  }, []);

  const registerFieldIncident = useCallback(
    (report: IncidentReport, reporterName?: string) => {
      // Local UI update helper, still relevant for immediate optimistic feedback 
      // if we weren't using useLiveQuery. But we are.
      return mapReportToIncident(report, reporterName);
    },
    [],
  );

  const resetToMock = useCallback(() => {
    // No-op
  }, []);

  const value = useMemo(
    () => ({
      incidents,
      setIncidents,
      registerFieldIncident,
      resetToMock,
    }),
    [incidents, registerFieldIncident, resetToMock],
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
