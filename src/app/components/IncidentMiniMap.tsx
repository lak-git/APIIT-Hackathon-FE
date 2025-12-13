import { useEffect } from "react";
import { MapContainer, TileLayer, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import { Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useGeolocation } from "../hooks/useGeolocation";
import type { Incident } from "../../types/incident";

// Fix for default Leaflet markers in React
// We'll use custom Lucide icons rendered as HTML instead for better style

function MapBoundsFitter({ 
  userLat, 
  userLng, 
  incidentLat, 
  incidentLng 
}: { 
  userLat: number | null, 
  userLng: number | null, 
  incidentLat: number, 
  incidentLng: number 
}) {
  const map = useMap();

  useEffect(() => {
    if (userLat && userLng) {
      const bounds = [
        [userLat, userLng],
        [incidentLat, incidentLng]
      ];
      map.fitBounds(bounds as any, { padding: [50, 50] });
    } else {
      map.setView([incidentLat, incidentLng], 14);
    }
  }, [userLat, userLng, incidentLat, incidentLng, map]);

  return null;
}

interface IncidentMiniMapProps {
  incident: Incident;
}

export function IncidentMiniMap({ incident }: IncidentMiniMapProps) {
  const { latitude, longitude } = useGeolocation();

  // Custom marker for User (Blue Pulse)
  const userIcon = divIcon({
    className: "bg-transparent",
    html: `<div class="relative flex h-4 w-4">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
           </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  // Custom marker for Incident (Red Alert)
  const incidentIcon = divIcon({
    className: "bg-transparent",
    html: `<div class="relative flex h-6 w-6 items-center justify-center">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow-lg"></span>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <div className="h-48 w-full rounded-lg overflow-hidden border border-gray-200 mt-4 relative z-0">
      <MapContainer
        center={[incident.location.lat, incident.location.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* User Location */}
        {latitude && longitude && (
          <Marker position={[latitude, longitude]} icon={userIcon}>
            <Popup>You</Popup>
          </Marker>
        )}

        {/* Incident Location */}
        <Marker position={[incident.location.lat, incident.location.lng]} icon={incidentIcon}>
            <Popup>{incident.type}</Popup>
        </Marker>

        <MapBoundsFitter 
          userLat={latitude} 
          userLng={longitude} 
          incidentLat={incident.location.lat} 
          incidentLng={incident.location.lng} 
        />
      </MapContainer>
    </div>
  );
}
