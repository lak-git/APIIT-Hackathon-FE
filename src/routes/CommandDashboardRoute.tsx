import { useEffect, useMemo, useState } from "react";

import { SummaryBadges } from "../components/SummaryBadges";
import { FilterControls } from "../components/FilterControls";
import { MapView } from "../components/MapView";
import { IncidentTable } from "../components/IncidentTable";
import { IncidentDetailPanel } from "../components/IncidentDetailPanel";
import type { Incident } from "../types/incident";
import { useIncidentData } from "../providers/IncidentProvider";

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
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

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
    if (!selectedIncident && filteredIncidents.length > 0) {
      setSelectedIncident(filteredIncidents[0]);
      return;
    }

    if (
      selectedIncident &&
      !filteredIncidents.some((incident) => incident.id === selectedIncident.id)
    ) {
      setSelectedIncident(filteredIncidents[0] ?? null);
    }
  }, [filteredIncidents, selectedIncident]);

  return (
    <section className="space-y-6">
      <SummaryBadges incidents={incidents} />

      <FilterControls filters={filters} onFilterChange={setFilters} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="bg-white/90 rounded-lg shadow-md border border-[#E5D5C3] p-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-[420px] rounded-lg overflow-hidden border border-[#E5D5C3]">
                <MapView
                  incidents={filteredIncidents}
                  selectedIncident={selectedIncident}
                  onIncidentClick={setSelectedIncident}
                />
              </div>

              <div className="max-h-[420px] rounded-lg border border-[#E5D5C3] bg-white">
                <IncidentTable
                  incidents={filteredIncidents}
                  selectedIncident={selectedIncident}
                  onIncidentClick={setSelectedIncident}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-6 self-start">
          <IncidentDetailPanel
            incident={selectedIncident}
            isOpen={Boolean(selectedIncident)}
            onClose={() => setSelectedIncident(null)}
          />
        </div>
      </div>
    </section>
  );
}
