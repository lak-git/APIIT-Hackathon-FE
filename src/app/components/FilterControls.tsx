import { Filter, X } from "lucide-react";
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
      return {
        label: "Fair (3)",
        color: "text-yellow-700",
        bg: "bg-yellow-50",
      };
    if (severity === 2)
      return { label: "Low (2)", color: "text-blue-600", bg: "bg-blue-50" };
    return {
      label: "Minimal (1)",
      color: "text-green-600",
      bg: "bg-green-50",
    };
  };

  // ✅ Shared checkbox style (maroon bg + white tick)
  const checkboxClass =
    "w-4 h-4 rounded border-gray-300 " +
    "text-white accent-[#800020] " +
    "checked:bg-[#800020] checked:border-[#800020] " +
    "focus:ring-[#800020] focus:ring-2";

  return (
    <div className="bg-white rounded-lg shadow-md border border-[#E5D5C3] p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#800020] flex items-center gap-2 font-semibold">
          <Filter className="w-5 h-5" />
          Filters
        </h3>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-[#800020] hover:text-[#6B1B2B] flex items-center gap-1"
            type="button"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Incident Type Filter */}
        <div>
          <h4 className="text-[#4A1A1A] mb-2 font-semibold">
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
                      ? "bg-[#FAF3E8] border-[#E5D5C3]"
                      : "bg-white border-[#EFE5DA]",
                    "hover:bg-[#FAF3E8]",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleType(type)}
                      className={checkboxClass}
                    />
                    <span className="text-[#6B4423]">{type}</span>
                  </div>

                  <span className="text-xs text-[#6B4423]/60">
                    Type
                  </span>
                </label>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-[#6B4423]/70">
            Tip: If none selected, all types are included.
          </p>
        </div>

        {/* Severity Filter */}
        <div>
          <h4 className="text-[#4A1A1A] mb-2 font-semibold">
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
                      ? `${info.bg} border-[#E5D5C3]`
                      : "bg-white border-[#EFE5DA]",
                    "hover:bg-[#FAF3E8]",
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

                  <span className="text-xs text-[#6B4423]/60">
                    Severity
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
