import { useEffect, useMemo, useState } from "react";

import { SummaryBadges } from "../app/components/SummaryBadges";
import { FilterControls } from "../app/components/FilterControls";
import { MapView } from "../app/components/MapView";
import { IncidentTable } from "../app/components/IncidentTable";
import { IncidentDetailPanel } from "../app/components/IncidentDetailPanel";
import { AccountApprovals } from "../app/components/accountApprovals";

import type { Incident } from "../types/incident";
import { useIncidentData } from "../providers/IncidentProvider";
import { useAuth } from "../providers/AuthProvider";

interface DashboardFilters {
  types: Incident["type"][];
  severities: Incident["severity"][];
  dateRange: { start: Date; end: Date } | null;
}

const defaultFilters: DashboardFilters = {
  types: [],
  severities: [1, 2, 3, 4, 5],
  dateRange: null,
};

export default function CommandDashboardRoute() {
  const { incidents } = useIncidentData();
  const { logout } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "accounts">("home");

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesType =
        filters.types.length === 0 || filters.types.includes(incident.type);

      const matchesSeverity = filters.severities.includes(incident.severity);

      const matchesDate = filters.dateRange
        ? incident.timestamp >= filters.dateRange.start &&
        incident.timestamp <= filters.dateRange.end
        : true;

      return matchesType && matchesSeverity && matchesDate;
    });
  }, [incidents, filters]);

  useEffect(() => {
    if (
      selectedIncident &&
      !filteredIncidents.some((i) => i.id === selectedIncident.id)
    ) {
      const next = filteredIncidents[0] ?? null;
      setSelectedIncident(next);
      if (!next) setIsPanelOpen(false);
    }

    if (!selectedIncident && filteredIncidents.length > 0) {
      setSelectedIncident(filteredIncidents[0]);
    }
  }, [filteredIncidents, selectedIncident]);

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <section className="space-y-6 relative">
      <SummaryBadges
        incidents={incidents}
        activeTab={activeView}
        onNavigate={setActiveView}
        onLogout={logout}
      />

      {activeView === "home" ? (
        <>
          <FilterControls filters={filters} onFilterChange={setFilters} />

          {/* ✅ INCIDENT AREA CARD */}
          <div className="bg-white/90 rounded-lg shadow-md border border-[#E5D5C3] p-4 space-y-4">
            <div className="h-[380px] rounded-lg overflow-hidden border border-[#E5D5C3]">
              <MapView
                incidents={filteredIncidents}
                selectedIncident={selectedIncident}
                onIncidentClick={handleIncidentClick}
              />
            </div>

            <div className="h-[500px] rounded-lg border border-[#E5D5C3] bg-white">
              <IncidentTable
                incidents={filteredIncidents}
                selectedIncident={selectedIncident}
                onIncidentClick={handleIncidentClick}
              />
            </div>
          </div>

          <IncidentDetailPanel
            incident={selectedIncident}
            isOpen={isPanelOpen}
            onClose={handleClosePanel}
          />
        </>
      ) : (
        <AccountApprovals />
      )}
    </section>
  );
}

