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
  // ✅ Severity palette (maroon → black, beige → white)
  const getSeverityRowStyle = (severity: number) => {
    if (severity === 5) return "border-l-black bg-white";
    if (severity === 4) return "border-l-[#B45309] bg-white";
    if (severity === 3) return "border-l-[#A16207] bg-white";
    if (severity === 2) return "border-l-[#1D4ED8] bg-[#EAF1FF]";
    return "border-l-[#166534] bg-[#EAF6EE]";
  };

  const getSeverityBadge = (severity: number) => {
    if (severity === 5) return "bg-black text-white";
    if (severity === 4) return "bg-[#C2410C] text-white";
    if (severity === 3) return "bg-[#A16207] text-white";
    if (severity === 2) return "bg-[#2563EB] text-white";
    return "bg-[#166534] text-white";
  };

  const getStatusBadge = (status: Incident["status"]) => {
    if (status === "Active") return "bg-white text-black";
    if (status === "Responding") return "bg-[#EAF1FF] text-[#1D4ED8]";
    return "bg-[#EAF6EE] text-[#166534]";
  };

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border border-[#E5E5E5] shadow-sm">
      {/* Helper hint */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-white bg-[#000000] border-b border-[#E5E5E5]">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-[#E5E5E5]">
          <Info className="w-4 h-4 text-black" />
        </span>
        <span className="font-medium">
          Select an incident row to view details on the right panel.
        </span>
      </div>

      {/* Table */}
      <div
        className={[
          "overflow-auto flex-1",
          "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2",
          "[&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-track]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb:hover]:bg-gray-400",
          "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-white",
        ].join(" ")}
      >
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5]">
            <tr>
              {["ID", "Type", "Severity", "Time", "Status"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-gray-500"
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
                      index % 2 === 0 ? "bg-white" : "bg-white",
                      "hover:bg-gray-50",
                      isSelected
                        ? "!bg-gray-200"
                        : "",
                    ].join(" ")}
                  >
                    {/* ID */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {incident.severity >= 4 && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-[#E5E5E5]">
                            <AlertCircle className="w-4 h-4 text-black" />
                          </span>
                        )}
                        <div className="font-mono text-black truncate">
                          {incident.id}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 text-sm text-black font-medium">
                      {incident.type}
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
                    <td className="px-4 py-3 text-sm text-black">
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
                          "inline-flex items-center border border-[#E5E5E5]",
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

      {/* Pagination */}
      {incidents.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-[#E5E5E5] bg-white">
          <span className="text-xs text-black">
            Page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span> •{" "}
            <span className="text-gray-500">{incidents.length} total</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              type="button"
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[#E5E5E5] bg-white text-black hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={page === totalPages}
              type="button"
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[#E5E5E5] bg-white text-black hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
