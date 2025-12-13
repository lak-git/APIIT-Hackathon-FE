import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";

import type { Incident } from "../types/incident";
import type { IncidentReport } from "../app/utils/storage";

interface IncidentContextValue {
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
  registerFieldIncident: (report: IncidentReport, reporterName?: string) => Incident;
  resetToMock: () => void;
}

const IncidentContext = createContext<IncidentContextValue | undefined>(undefined);

const FALLBACK_ADDRESS = "Awaiting verified address";

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

import { db } from "../db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { storage } from "../app/utils/storage";

export function IncidentProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Directly query Dexie for all reports
  const reports = useLiveQuery(() => db.reports.toArray()) ?? [];

  // Sync Dexie reports to local state whenever they change
  useEffect(() => {
    if (reports) {
      const mappedIncidents = reports.map((r) =>
        mapReportToIncident(r, storage.getUser()?.name)
      );
      setIncidents(mappedIncidents);
    }
  }, [reports]);

  const registerFieldIncident = useCallback(
    (report: IncidentReport, reporterName?: string) => {
      // This might now be redundant if we rely on useLiveQuery, 
      // but keeping it for compatibility or immediate UI updates if needed.
      // Logic: Just rely on the useEffect above to catch the DB change.
      return mapReportToIncident(report, reporterName);
    },
    [],
  );

  const resetToMock = useCallback(() => {
    // No-op or clear DB? User asked to remove mock.
    setIncidents([]);
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
