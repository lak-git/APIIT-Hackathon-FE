import { useMemo, useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import type { IncidentType } from "../../types/incident";

interface FilterControlsProps {
  filters: {
    types: IncidentType[];
    severities: number[];
    dateRange: { start: Date; end: Date } | null;
  };
  onFilterChange: (filters: any) => void;
}

export function FilterControls({ filters, onFilterChange }: FilterControlsProps) {
  // ✅ Retracted (collapsed) by default
  const [isExpanded, setIsExpanded] = useState(false);

  const incidentTypes: IncidentType[] = [
    "Flood",
    "Landslide",
    "Road Block",
    "Power Line Down",
  ];
  const severityLevels = [1, 2, 3, 4, 5];

  const toggleType = (type: IncidentType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];

    onFilterChange({ ...filters, types: newTypes });
  };

  const toggleSeverity = (severity: number) => {
    const newSeverities = filters.severities.includes(severity)
      ? filters.severities.filter((s) => s !== severity)
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

  const hasActiveFilters =
    filters.types.length > 0 || filters.severities.length < 5;

  const severityLabel = (severity: number) => {
    if (severity === 5)
      return { label: "Critical (5)", color: "text-red-600", bg: "bg-red-50" };
    if (severity === 4)
      return { label: "High (4)", color: "text-orange-600", bg: "bg-orange-50" };
    if (severity === 3)
      return { label: "Fair (3)", color: "text-yellow-700", bg: "bg-yellow-50" };
    if (severity === 2)
      return { label: "Low (2)", color: "text-blue-600", bg: "bg-blue-50" };
    return { label: "Minimal (1)", color: "text-green-600", bg: "bg-green-50" };
  };

  // ✅ Black checkbox styling
  const checkboxClass =
    "w-4 h-4 rounded border-gray-300 accent-black focus:ring-black focus:ring-2";

  const selectionSummary = useMemo(() => {
    const typeText =
      filters.types.length === 0
        ? "All types"
        : `${filters.types.length} type${filters.types.length > 1 ? "s" : ""}`;

    const sevText =
      filters.severities.length === 5
        ? "All severities"
        : `${filters.severities.length} selected`;

    return `${typeText} • ${sevText}`;
  }, [filters.types, filters.severities]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-black" />
          <span className="text-black font-semibold">Filters</span>

          <span className="ml-2 hidden sm:inline text-xs text-gray-500">
            {selectionSummary}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-700 border border-gray-200">
              Active
            </span>
          )}

          <ChevronDown
            className={[
              "w-5 h-5 text-black transition-transform",
              isExpanded ? "rotate-180" : "rotate-0",
            ].join(" ")}
          />
        </div>
      </button>

      {/* Collapsible content */}
      <div
        className={[
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            {/* Top row */}
            <div className="flex items-center justify-between pt-3">
              <div className="text-xs text-gray-500">
                Choose what you want to see on the map & table.
              </div>

              {hasActiveFilters && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAllFilters();
                  }}
                  className="text-sm text-black hover:opacity-70 flex items-center gap-1"
                  type="button"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Incident Type */}
              <div>
                <h4 className="text-black mb-2 font-semibold">
                  Incident Type
                </h4>

                <div className="space-y-2">
                  {incidentTypes.map((type) => {
                    const checked =
                      filters.types.length === 0 || filters.types.includes(type);

                    return (
                      <label
                        key={type}
                        className={[
                          "flex items-center justify-between gap-3 cursor-pointer",
                          "p-2 rounded-lg border transition-colors",
                          checked
                            ? "bg-white border-gray-300"
                            : "bg-white border-gray-200",
                          "hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleType(type)}
                            className={checkboxClass}
                          />
                          <span className="text-gray-700">{type}</span>
                        </div>

                        <span className="text-xs text-gray-400">Type</span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <p className="m-0 text-xs text-gray-600">
                    Leaving all types checked shows everything. Untick a type to
                    hide it.
                  </p>
                </div>
              </div>

              {/* Severity */}
              <div>
                <h4 className="text-black mb-2 font-semibold">
                  Severity Level
                </h4>

                <div className="space-y-2">
                  {severityLevels.map((level) => {
                    const info = severityLabel(level);
                    const checked = filters.severities.includes(level);

                    return (
                      <label
                        key={level}
                        className={[
                          "flex items-center justify-between gap-3 cursor-pointer",
                          "p-2 rounded-lg border transition-colors",
                          checked
                            ? `${info.bg} border-gray-300`
                            : "bg-white border-gray-200",
                          "hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSeverity(level)}
                            className={checkboxClass}
                          />
                          <span className={info.color}>{info.label}</span>
                        </div>

                        <span className="text-xs text-gray-400">
                          Severity
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <p className="m-0 text-xs text-gray-600">
                    Keep “High” and “Critical” selected to focus on urgent
                    incidents.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Tip: Click the “Filters” header again to collapse this panel.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
