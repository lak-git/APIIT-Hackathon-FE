import React from 'react';
import { Filter, X } from 'lucide-react';
import { IncidentType } from '../types/incident';

interface FilterControlsProps {
  filters: {
    types: IncidentType[];
    severities: number[];
    dateRange: { start: Date; end: Date } | null;
  };
  onFilterChange: (filters: any) => void;
}

export function FilterControls({ filters, onFilterChange }: FilterControlsProps) {
  const incidentTypes: IncidentType[] = ['Flood', 'Landslide', 'Road Block', 'Power Line Down'];
  const severityLevels = [1, 2, 3, 4, 5];

  const toggleType = (type: IncidentType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFilterChange({ ...filters, types: newTypes });
  };

  const toggleSeverity = (severity: number) => {
    const newSeverities = filters.severities.includes(severity)
      ? filters.severities.filter(s => s !== severity)
      : [...filters.severities, severity];
    onFilterChange({ ...filters, severities: newSeverities });
  };

  const clearAllFilters = () => {
    onFilterChange({
      types: [],
      severities: [1, 2, 3, 4, 5],
      dateRange: null,
    });
  };

  const hasActiveFilters = filters.types.length > 0 || filters.severities.length < 5;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#800020] flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-[#800020] hover:text-[#6B1B2B] flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Incident Type Filter */}
        <div>
          <h4 className="text-[#4A1A1A] mb-2">Incident Type</h4>
          <div className="space-y-2">
            {incidentTypes.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer hover:bg-[#FAF3E8] p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.types.length === 0 || filters.types.includes(type)}
                  onChange={() => toggleType(type)}
                  className="w-4 h-4 text-[#800020] border-gray-300 rounded focus:ring-[#800020]"
                />
                <span className="text-[#6B4423]">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Severity Filter */}
        <div>
          <h4 className="text-[#4A1A1A] mb-2">Severity Level</h4>
          <div className="space-y-2">
            {severityLevels.map((level) => {
              const getSeverityLabel = (severity: number) => {
                if (severity === 5) return { label: 'Critical (5)', color: 'text-red-600' };
                if (severity === 4) return { label: 'High (4)', color: 'text-orange-600' };
                if (severity === 3) return { label: 'Medium (3)', color: 'text-yellow-600' };
                if (severity === 2) return { label: 'Low (2)', color: 'text-blue-600' };
                return { label: 'Minimal (1)', color: 'text-green-600' };
              };
              const info = getSeverityLabel(level);
              
              return (
                <label
                  key={level}
                  className="flex items-center gap-2 cursor-pointer hover:bg-[#FAF3E8] p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.severities.includes(level)}
                    onChange={() => toggleSeverity(level)}
                    className="w-4 h-4 text-[#800020] border-gray-300 rounded focus:ring-[#800020]"
                  />
                  <span className={`${info.color}`}>{info.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
