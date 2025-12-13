import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { Incident } from "../types/incident";
import type { IncidentReport } from "../app/utils/storage";
import { mockIncidents } from "../data/mockIncidents";
import { useSyncManager } from "../hooks/useSyncManager";

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

export function IncidentProvider({ children }: { children: React.ReactNode }) {
  useSyncManager();
  const [incidents, setIncidents] = useState<Incident[]>(() => [...mockIncidents]);

  const registerFieldIncident = useCallback(
    (report: IncidentReport, reporterName?: string) => {
      const mapped = mapReportToIncident(report, reporterName);
      setIncidents((prev) => {
        const alreadyExists = prev.some((incident) => incident.id === mapped.id);
        if (alreadyExists) {
          return prev;
        }
        return [mapped, ...prev];
      });
      return mapped;
    },
    [],
  );

  const resetToMock = useCallback(() => {
    setIncidents([...mockIncidents]);
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
