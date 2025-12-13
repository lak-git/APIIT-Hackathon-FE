import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import type { Incident } from "../../types/incident";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onIncidentClick: (incident: Incident) => void;
}

// Helper component to handle flying to selected incident
function MapUpdater({ selectedIncident }: { selectedIncident: Incident | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedIncident && selectedIncident.location) {
      map.flyTo(
        [selectedIncident.location.lat, selectedIncident.location.lng],
        13,
        { animate: true, duration: 1.5 },
      );
    }
  }, [selectedIncident, map]);

  return null;
}

export function MapView({ incidents, selectedIncident, onIncidentClick }: MapViewProps) {
  const getSeverityStyles = (severity: number) => {
    switch (severity) {
      case 5:
        return { color: "#dc2626", radius: 12 }; // Critical
      case 4:
        return { color: "#f97316", radius: 10 }; // High
      case 3:
        return { color: "#eab308", radius: 8 }; // Medium
      case 2:
        return { color: "#3b82f6", radius: 6 }; // Low
      case 1:
      default:
        return { color: "#22c55e", radius: 6 }; // Minimal
    }
  };

  const defaultPosition: [number, number] = [6.6828, 80.3992]; // Ratnapura

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={defaultPosition}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater selectedIncident={selectedIncident} />

        {incidents.map((incident) => {
          const { color, radius } = getSeverityStyles(incident.severity);

          return (
            <CircleMarker
              key={incident.id}
              center={[incident.location.lat, incident.location.lng]}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.7,
              }}
              radius={radius}
              eventHandlers={{
                click: () => onIncidentClick(incident),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong className="block mb-1 text-base">{incident.type}</strong>
                  <span className="text-gray-600">{incident.description}</span>
                  <div className="mt-2 text-xs text-gray-400">
                    Severity Level: {incident.severity}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Map title overlay (CENTER TOP) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-4 py-2 pointer-events-none text-center">
        <div className="text-sm font-semibold text-[#800020]">
          Incident Overview Map
        </div>
        <div className="text-xs text-[#6B4423]">
          Displays all reported incidents by location
        </div>
      </div>

      {/* Legend overlay */}
      <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3">
        <div className="text-xs text-[#6B4423] mb-2 font-medium">
          Severity Legend
        </div>
        <div className="space-y-1.5">
          {[
            { level: 5, label: "Critical", color: "#dc2626" },
            { level: 4, label: "High", color: "#f97316" },
            { level: 3, label: "Medium", color: "#eab308" },
            { level: 2, label: "Low", color: "#3b82f6" },
            { level: 1, label: "Minimal", color: "#22c55e" },
          ].map(({ level, label, color }) => (
            <div key={level} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[#6B4423]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 pointer-events-none">
        <div className="text-xs text-[#6B4423]">
          📍 Ratnapura Area • Click markers for details
        </div>
      </div>
    </div>
  );
}
