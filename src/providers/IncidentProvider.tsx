import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import type { Incident, IncidentType } from "../types/incident";
import type { IncidentReport } from "../app/utils/storage";
import { useSyncManager } from "../app/hooks/useSyncManager";
import { db } from "../db/db";
import { storage } from "../app/utils/storage";
import { supabase } from "../supabaseClient";
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
  // 1. Hook for background syncing (Dexie -> Supabase)
  const { sync } = useSyncManager();
  const { isLoading: authLoading, isAuthenticated, session } = useAuth();

  // 2. State for Remote Data (Source of Truth)
  const [remoteIncidents, setRemoteIncidents] = useState<Incident[]>([]);

  // 3. State for Local Data (Pending/Offline items)
  // Directly query Dexie for all reports
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
