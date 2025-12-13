import type { Incident } from "../../types/incident";
import { AlertCircle, Info } from "lucide-react";

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
  const getSeverityRowStyle = (severity: number) => {
    if (severity === 5) return "border-l-red-600 bg-red-50/60";
    if (severity === 4) return "border-l-orange-500 bg-orange-50/60";
    if (severity === 3) return "border-l-yellow-500 bg-yellow-50/60";
    if (severity === 2) return "border-l-blue-400 bg-blue-50/60";
    return "border-l-green-500 bg-green-50/60";
  };

  const getSeverityBadge = (severity: number) => {
    if (severity === 5) return "bg-red-600 text-white";
    if (severity === 4) return "bg-orange-500 text-white";
    if (severity === 3) return "bg-yellow-500 text-white";
    if (severity === 2) return "bg-blue-500 text-white";
    return "bg-green-500 text-white";
  };

  const getStatusBadge = (status: Incident["status"]) => {
    if (status === "Active") return "bg-red-100 text-red-800";
    if (status === "Responding") return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Helper hint */}
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-[#6B4423] bg-[#FAF3E8] border-b border-[#E5D5C3]">
        <Info className="w-4 h-4 text-[#800020]" />
        Click on an incident row to view detailed information
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-[#F0E6D8]">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#4A1A1A]">
                ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#4A1A1A]">
                Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#4A1A1A]">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#4A1A1A]">
                Time
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#4A1A1A]">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-[#6B4423]/60"
                >
                  No incidents match the current filters
                </td>
              </tr>
            ) : (
              incidents.map((incident, index) => {
                const isSelected = selectedIncident?.id === incident.id;

                return (
                  <tr
                    key={incident.id}
                    onClick={() => onIncidentClick(incident)}
                    className={[
                      "cursor-pointer transition-all border-l-4",
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
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-mono text-[#4A1A1A]">
                          {incident.id}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 text-sm text-[#6B4423]">
                      {incident.type}
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "px-3 py-1 rounded-full text-xs font-semibold inline-block min-w-[64px] text-center",
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
                          "px-2 py-1 rounded text-xs font-medium",
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
    </div>
  );
}
