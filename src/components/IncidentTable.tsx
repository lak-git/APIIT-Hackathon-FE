import React from 'react';
import { Incident } from '../types/incident';
import { AlertCircle } from 'lucide-react';

interface IncidentTableProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onIncidentClick: (incident: Incident) => void;
}

export function IncidentTable({ incidents, selectedIncident, onIncidentClick }: IncidentTableProps) {
  const getSeverityColor = (severity: number) => {
    if (severity === 5) return 'bg-red-100 border-l-4 border-red-600';
    if (severity === 4) return 'bg-orange-100 border-l-4 border-orange-500';
    if (severity === 3) return 'bg-yellow-100 border-l-4 border-yellow-500';
    if (severity === 2) return 'bg-blue-100 border-l-4 border-blue-400';
    return 'bg-green-100 border-l-4 border-green-500';
  };

  const getSeverityBadge = (severity: number) => {
    if (severity === 5) return 'bg-red-600 text-white';
    if (severity === 4) return 'bg-orange-500 text-white';
    if (severity === 3) return 'bg-yellow-500 text-white';
    if (severity === 2) return 'bg-blue-400 text-white';
    return 'bg-green-500 text-white';
  };

  return (
    <div className="overflow-auto max-h-full">
      <table className="w-full">
        <thead className="bg-[#F0E6D8] sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-[#4A1A1A]">ID</th>
            <th className="px-4 py-3 text-left text-[#4A1A1A]">Type</th>
            <th className="px-4 py-3 text-left text-[#4A1A1A]">Severity</th>
            <th className="px-4 py-3 text-left text-[#4A1A1A]">Time</th>
            <th className="px-4 py-3 text-left text-[#4A1A1A]">Status</th>
          </tr>
        </thead>
        <tbody>
          {incidents.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-[#6B4423]/60">
                No incidents match the current filters
              </td>
            </tr>
          ) : (
            incidents.map((incident) => (
              <tr
                key={incident.id}
                onClick={() => onIncidentClick(incident)}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  getSeverityColor(incident.severity)
                } ${
                  selectedIncident?.id === incident.id 
                    ? 'ring-2 ring-[#800020] ring-inset' 
                    : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {incident.severity >= 4 && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-mono">{incident.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{incident.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full inline-block min-w-[60px] text-center ${getSeverityBadge(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {incident.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-sm ${
                    incident.status === 'Active' 
                      ? 'bg-red-100 text-red-800'
                      : incident.status === 'Responding'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {incident.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
