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

  // Split filtered incidents into Active (for Map/Top Table) and Resolved (Bottom Table)
  const activeIncidents = useMemo(() => filteredIncidents.filter(i => i.status !== 'Resolved'), [filteredIncidents]);
  const resolvedIncidents = useMemo(() => filteredIncidents.filter(i => i.status === 'Resolved'), [filteredIncidents]);

  useEffect(() => {
    // Determine the relevant list to select from based on where the selection came from?
    // Actually, we just need to ensure if an incident is selected, it can be from either list.
    // Auto-selection logic might need adjustment if we want to default to active only.
    if (
      selectedIncident &&
      !filteredIncidents.some((i) => i.id === selectedIncident.id)
    ) {
      const next = activeIncidents[0] ?? resolvedIncidents[0] ?? null;
      setSelectedIncident(next);
      if (!next) setIsPanelOpen(false);
    }

    if (!selectedIncident && activeIncidents.length > 0) {
      setSelectedIncident(activeIncidents[0]);
    }
  }, [filteredIncidents, activeIncidents, resolvedIncidents, selectedIncident]);

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

          {/* ✅ ACTIVE INCIDENTS AREA */}
          <div className="bg-white/90 rounded-lg shadow-md border border-gray-300 p-4 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-8 bg-red-600 rounded-full"></span>
              Active Operations
            </h2>
            <div className="h-[500px] rounded-lg overflow-hidden border border-gray-300">
              <MapView
                incidents={activeIncidents}
                selectedIncident={selectedIncident}
                onIncidentClick={handleIncidentClick}
              />
            </div>

            <div className="h-[500px] rounded-lg border border-gray-300 bg-white">
              <IncidentTable
                incidents={activeIncidents}
                selectedIncident={selectedIncident}
                onIncidentClick={handleIncidentClick}
              />
            </div>
          </div>

          {/* ✅ RESOLVED INCIDENTS AREA */}
          {resolvedIncidents.length > 0 && (
            <div className="bg-white/90 rounded-lg shadow-md border border-gray-300 p-4 space-y-4 mt-8">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-8 bg-green-600 rounded-full"></span>
                Resolved Operations
              </h2>
              <div className="h-[400px] rounded-lg border border-gray-300 bg-white">
                <IncidentTable
                  incidents={resolvedIncidents}
                  selectedIncident={selectedIncident}
                  onIncidentClick={handleIncidentClick}
                />
              </div>
            </div>
          )}

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

