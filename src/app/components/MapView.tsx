import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import {
  Layers,
  CloudRain,
  Wind,
  Cloud,
  Thermometer,
  Map as MapIcon,
  Sun,
  Flame,
} from "lucide-react";
import type { Incident } from "../../types/incident";
import { HeatmapLayer } from "./HeatmapLayer";
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
  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

  // Custom Layer State
  const [activeBaseMap, setActiveBaseMap] = useState<'osm' | 'light'>('osm');
  const [weatherLayers, setWeatherLayers] = useState({
    precipitation: false,
    clouds: false,
    temp: false,
    wind: false,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  useEffect(() => {
    if (!API_KEY) {
      console.warn("VITE_OPENWEATHER_API_KEY is missing. Weather layers will not render properly.");
    }
  }, [API_KEY]);

  const toggleWeatherLayer = (layer: keyof typeof weatherLayers) => {
    setWeatherLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

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
        zoomControl={false}
      >
        {/* Base Map Layer */}
        {activeBaseMap === 'osm' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        )}

        {/* Weather Overlays */}
        {API_KEY && weatherLayers.precipitation && (
          <TileLayer
            key="precip"
            url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`}
            opacity={1.0}
            zIndex={10}
          />
        )}
        {API_KEY && weatherLayers.clouds && (
          <TileLayer
            key="clouds"
            url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`}
            opacity={1.0}
            zIndex={10}
          />
        )}
        {API_KEY && weatherLayers.temp && (
          <TileLayer
            key="temp"
            url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`}
            opacity={1.0}
            zIndex={10}
          />
        )}

        {/* Wind Layer - Stacked for visibility */}
        {API_KEY && weatherLayers.wind && (
          <>
            {/* Color Gradient Layer */}
            <TileLayer
              key="wind-color"
              url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`}
              opacity={0.6}
              zIndex={10}
            />
            {/* Arrow/Direction Layer (experimental params) */}
            <TileLayer
              key="wind-arrows"
              url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}&arrow_step=16`}
              opacity={0.8}
              zIndex={11}
            />
          </>
        )}

        <MapUpdater selectedIncident={selectedIncident} />

        {/* Heatmap Layer */}
        {heatmapEnabled && (
          <HeatmapLayer
            points={incidents.map((i) => [
              i.location.lat,
              i.location.lng,
              i.severity / 5, // Normalize severity to 0-1 intensity
            ])}
            radius={30}
            blur={20}
            max={1.0}
            gradient={{
              0.0: '#22c55e',
              0.25: '#3b82f6',
              0.5: '#eab308',
              0.75: '#f97316',
              1.0: '#dc2626',
            }}
          />
        )}

        {/* Incident Markers (hidden when heatmap is enabled) */}
        {!heatmapEnabled && incidents.map((incident) => {
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

      {/* Floating Floating Dock - High Fidelity UI */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`
            p-3 rounded-xl shadow-lg transition-all duration-300 border
            ${isMenuOpen
              ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-200'
              : 'bg-white/95 text-gray-700 hover:bg-white border-gray-100/50 hover:scale-105'
            }
          `}
          title="Map Layers & Weather"
        >
          <Layers className="w-6 h-6" />
        </button>

        {isMenuOpen && (
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-gray-100 w-72 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Section 1: Base Style */}
            <div className="mb-5">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Base Map</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveBaseMap('osm')}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200
                    ${activeBaseMap === 'osm'
                      ? 'bg-blue-50/50 border-blue-500 text-blue-700 shadow-sm'
                      : 'bg-gray-50/50 border-transparent text-gray-500 hover:bg-gray-100 hover:border-gray-200'
                    }
                  `}
                >
                  <MapIcon className="w-5 h-5" />
                  <span className="text-xs font-semibold">Standard</span>
                  {activeBaseMap === 'osm' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>
                <button
                  onClick={() => setActiveBaseMap('light')}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200
                    ${activeBaseMap === 'light'
                      ? 'bg-blue-50/50 border-blue-500 text-blue-700 shadow-sm'
                      : 'bg-gray-50/50 border-transparent text-gray-500 hover:bg-gray-100 hover:border-gray-200'
                    }
                  `}
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-xs font-semibold">Clean Light</span>
                  {activeBaseMap === 'light' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4" />

            {/* Section 2: Analysis Overlays */}
            <div className="mb-5">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Analysis</h3>
              <button
                onClick={() => setHeatmapEnabled(!heatmapEnabled)}
                className={`
                  group flex items-center justify-between w-full p-2.5 rounded-lg border transition-all duration-200
                  ${heatmapEnabled
                    ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm'
                    : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${heatmapEnabled ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                    <Flame className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Density Heatmap</span>
                </div>

                {/* Toggle Switch */}
                <div className={`
                  w-10 h-5 rounded-full relative transition-colors duration-300
                  ${heatmapEnabled ? 'bg-orange-500' : 'bg-gray-200'}
                `}>
                  <div className={`
                    absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300
                    ${heatmapEnabled ? 'translate-x-5' : 'translate-x-0'}
                  `} />
                </div>
              </button>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4" />

            {/* Section 2: Weather Overlays */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Live Weather</h3>
              <div className="space-y-2">
                {[
                  { id: 'wind', label: 'Wind Speed', icon: Wind },
                  { id: 'precipitation', label: 'Precipitation', icon: CloudRain },
                  { id: 'clouds', label: 'Cloud Cover', icon: Cloud },
                  { id: 'temp', label: 'Temperature', icon: Thermometer },
                ].map((item) => {
                  const isActive = weatherLayers[item.id as keyof typeof weatherLayers];
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleWeatherLayer(item.id as keyof typeof weatherLayers)}
                      className={`
                        group flex items-center justify-between w-full p-2.5 rounded-lg border transition-all duration-200
                        ${isActive
                          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                          : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>

                      {/* Custom Toggle Switch Appearance */}
                      <div className={`
                        w-10 h-5 rounded-full relative transition-colors duration-300
                        ${isActive ? 'bg-blue-500' : 'bg-gray-200'}
                      `}>
                        <div className={`
                          absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300
                          ${isActive ? 'translate-x-5' : 'translate-x-0'}
                        `} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {!API_KEY && (
              <div className="mt-4 p-2 bg-red-50 text-red-600 text-[10px] rounded border border-red-100 text-center">
                API Key Missing (Check .env)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map title overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/20 px-6 py-2.5 pointer-events-none text-center">
        <div className="text-sm font-bold text-gray-800 tracking-tight">
          Incident Overview Map
        </div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
          Live Monitoring
        </div>
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-6 right-4 z-[400] bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-4">
        <div className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
          Severity Levels
        </div>
        <div className="space-y-2">
          {[
            { level: 5, label: "Critical", color: "#dc2626" },
            { level: 4, label: "High", color: "#f97316" },
            { level: 3, label: "Medium", color: "#eab308" },
            { level: 2, label: "Low", color: "#3b82f6" },
            { level: 1, label: "Minimal", color: "#22c55e" },
          ].map(({ level, label, color }) => (
            <div key={level} className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }}></span>
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: color }}></span>
              </span>
              <span className="text-xs text-gray-600 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
