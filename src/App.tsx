import React, { useState, useMemo } from 'react';
import { IncidentTable } from './components/IncidentTable';
import { IncidentDetailPanel } from './components/IncidentDetailPanel';
import { MapView } from './components/MapView';
import { FilterControls } from './components/FilterControls';
import { SummaryBadges } from './components/SummaryBadges';
import { Incident, IncidentType } from './types/incident';
import { mockIncidents } from './data/mockIncidents';

export default function App() {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    types: [] as IncidentType[],
    severities: [1, 2, 3, 4, 5],
    dateRange: null as { start: Date; end: Date } | null,
  });

  // Filter incidents based on active filters
  const filteredIncidents = useMemo(() => {
    return mockIncidents.filter(incident => {
      const typeMatch = filters.types.length === 0 || filters.types.includes(incident.type);
      const severityMatch = filters.severities.includes(incident.severity);
      return typeMatch && severityMatch;
    });
  }, [filters]);

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF3E8] flex flex-col">
      {/* Header */}
      <header className="bg-[#800020] text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl">Disaster Response Command</h1>
            <p className="text-white/80 mt-1">Emergency Management Dashboard</p>
          </div>
          <div className="text-right">
            <p className="text-white/80">Last Updated</p>
            <p>{new Date().toLocaleString()}</p>
          </div>
        </div>
      </header>

      {/* Summary Badges */}
      <div className="px-6 py-4">
        <SummaryBadges incidents={filteredIncidents} />
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-6 flex gap-6 overflow-hidden">
        <div className={`flex-1 flex flex-col gap-6 min-w-0 transition-all duration-300 ${isPanelOpen ? 'mr-0' : ''}`}>
          {/* Filters */}
          <FilterControls filters={filters} onFilterChange={setFilters} />

          {/* Map and Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Map View */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="bg-[#800020] text-white px-4 py-3">
                <h2 className="text-xl">Incident Map</h2>
              </div>
              <div className="flex-1 min-h-[400px]">
                <MapView 
                  incidents={filteredIncidents}
                  selectedIncident={selectedIncident}
                  onIncidentClick={handleIncidentClick}
                />
              </div>
            </div>

            {/* Incident Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="bg-[#800020] text-white px-4 py-3">
                <h2 className="text-xl">Live Incidents</h2>
              </div>
              <div className="flex-1 overflow-auto">
                <IncidentTable 
                  incidents={filteredIncidents}
                  selectedIncident={selectedIncident}
                  onIncidentClick={handleIncidentClick}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Incident Detail Panel */}
        <IncidentDetailPanel
          incident={selectedIncident}
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
        />
      </div>
    </div>
  );
}
