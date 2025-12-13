import type { Incident } from "../../types/incident";
import { AlertCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";

interface IncidentTableProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onIncidentClick: (incident: Incident) => void;
}

export function IncidentTable({
  incidents,
  selectedIncident,
  onIncidentClick,
}: IncidentTableProps) {
  // ✅ Severity palette tuned to match maroon + beige theme
  const getSeverityRowStyle = (severity: number) => {
    if (severity === 5) return "border-l-[#8B1E2D] bg-[#F8E9EC]"; // deep maroon tint
    if (severity === 4) return "border-l-[#B45309] bg-[#FFF2E1]"; // warm amber
    if (severity === 3) return "border-l-[#A16207] bg-[#FFF7D6]"; // golden beige
    if (severity === 2) return "border-l-[#1D4ED8] bg-[#EAF1FF]"; // clean blue tint
    return "border-l-[#166534] bg-[#EAF6EE]"; // dark green tint
  };

  const getSeverityBadge = (severity: number) => {
    if (severity === 5) return "bg-[#8B1E2D] text-white"; // deep maroon
    if (severity === 4) return "bg-[#C2410C] text-white"; // burnt orange
    if (severity === 3) return "bg-[#A16207] text-white"; // golden
    if (severity === 2) return "bg-[#2563EB] text-white"; // blue
    return "bg-[#166534] text-white"; // dark green
  };

  const getStatusBadge = (status: Incident["status"]) => {
    if (status === "Active") return "bg-[#F8E9EC] text-[#8B1E2D]";
    if (status === "Responding") return "bg-[#EAF1FF] text-[#1D4ED8]";
    return "bg-[#EAF6EE] text-[#166534]";
  };

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset page when filters change (total items change)
  useEffect(() => {
    setPage(1);
  }, [incidents.length]);

  const totalPages = Math.ceil(incidents.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedIncidents = incidents.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleNext = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border border-[#E5D5C3] shadow-sm">
      {/* Helper hint */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#6B4423] bg-[#FAF3E8] border-b border-[#E5D5C3]">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-[#E5D5C3]">
          <Info className="w-4 h-4 text-[#800020]" />
        </span>
        <span className="font-medium">
          Select an incident row to view details on the right panel.
        </span>
      </div>

      {/* Table */}
      <div
        className={[
          "overflow-auto flex-1",
          // ✅ Neater scrollbar (works in modern browsers; uses Tailwind arbitrary selectors)
          "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2",
          "[&::-webkit-scrollbar-track]:bg-[#FAF3E8] [&::-webkit-scrollbar-track]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-[#D6C2AE] [&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb:hover]:bg-[#C4AE98]",
          "scrollbar-thin scrollbar-thumb-[#D6C2AE] scrollbar-track-[#FAF3E8]", // if you have tailwind-scrollbar plugin
        ].join(" ")}
      >
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-[#F0E6D8] border-b border-[#E5D5C3]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#4A1A1A]">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#4A1A1A]">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#4A1A1A]">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#4A1A1A]">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#4A1A1A]">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-[#6B4423]/60"
                >
                  No incidents match the current filters.
                </td>
              </tr>
            ) : (
              paginatedIncidents.map((incident, index) => {
                const isSelected = selectedIncident?.id === incident.id;

                return (
                  <tr
                    key={incident.id}
                    onClick={() => onIncidentClick(incident)}
                    className={[
                      "cursor-pointer transition-colors border-l-4",
                      getSeverityRowStyle(incident.severity),
                      index % 2 === 0 ? "bg-white" : "bg-white/70",
                      "hover:bg-[#FAF3E8]",
                      isSelected
                        ? "ring-2 ring-[#800020] ring-inset bg-[#FAF3E8]"
                        : "",
                    ].join(" ")}
                  >
                    {/* ID */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {incident.severity >= 4 && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-[#E5D5C3]">
                            <AlertCircle className="w-4 h-4 text-[#8B1E2D]" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="font-mono text-[#4A1A1A] truncate">
                            {incident.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 text-sm text-[#6B4423]">
                      <span className="font-medium">{incident.type}</span>
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center justify-center min-w-[72px]",
                          "shadow-sm",
                          getSeverityBadge(incident.severity),
                        ].join(" ")}
                      >
                        {incident.severity}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3 text-sm text-[#6B4423]">
                      {incident.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "px-2.5 py-1 rounded-full text-xs font-semibold",
                          "inline-flex items-center border border-[#E5D5C3]/60",
                          getStatusBadge(incident.status),
                        ].join(" ")}
                      >
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {incidents.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-[#E5D5C3] bg-white">
          <span className="text-xs text-[#6B4423]">
            Page <span className="font-semibold text-[#4A1A1A]">{page}</span> of{" "}
            <span className="font-semibold text-[#4A1A1A]">{totalPages}</span>{" "}
            <span className="text-[#6B4423]/70">•</span>{" "}
            <span className="text-[#6B4423]/80">{incidents.length} total</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              type="button"
              className={[
                "px-3 py-1.5 text-xs font-semibold rounded-md",
                "border border-[#E5D5C3] bg-white text-[#4A1A1A]",
                "hover:bg-[#FAF3E8] transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={page === totalPages}
              type="button"
              className={[
                "px-3 py-1.5 text-xs font-semibold rounded-md",
                "border border-[#E5D5C3] bg-white text-[#4A1A1A]",
                "hover:bg-[#FAF3E8] transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
