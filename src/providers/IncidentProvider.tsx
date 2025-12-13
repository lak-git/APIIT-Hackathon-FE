import { createContext, useCallback, useContext, useMemo } from "react";

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
  // Directly query Dexie for all reports
  const reports = useLiveQuery(() => db.reports.toArray()) ?? [];

  // Derive incidents from Dexie reports
  const incidents = useMemo(() => {
    return reports.map((r) => mapReportToIncident(r, storage.getUser()?.name));
  }, [reports]);

  // Backward compatibility / No-op setters since we are now reactive to DB
  const setIncidents: React.Dispatch<React.SetStateAction<Incident[]>> = useCallback(() => {
    console.warn("setIncidents is deprecated. Modify Dexie DB directly.");
  }, []);

  const registerFieldIncident = useCallback(
    (report: IncidentReport, reporterName?: string) => {
      // No-op: Data should be added to Dexie, which will auto-update state
      return mapReportToIncident(report, reporterName);
    },
    [],
  );

  const resetToMock = useCallback(() => {
    // Optional: db.reports.clear(); if we wanted a "Reset" button.
    // For now, do nothing.
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
