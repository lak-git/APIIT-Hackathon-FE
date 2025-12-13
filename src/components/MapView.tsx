import React, { useEffect, useRef } from "react";
import type { Incident } from "../types/incident";

interface MapViewProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onIncidentClick: (incident: Incident) => void;
}

export function MapView({
  incidents,
  selectedIncident,
  onIncidentClick,
}: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = (
    lat: number,
    lng: number,
    width: number,
    height: number
  ) => {
    // Bounding box for New York City area
    const minLat = 40.7;
    const maxLat = 40.77;
    const minLng = -74.02;
    const maxLng = -73.97;

    const x = ((lng - minLng) / (maxLng - minLng)) * width;
    const y = ((maxLat - lat) / (maxLat - minLat)) * height;

    return { x, y };
  };

  const getSeverityColor = (severity: number) => {
    if (severity === 5) return "#dc2626";
    if (severity === 4) return "#f97316";
    if (severity === 3) return "#eab308";
    if (severity === 2) return "#3b82f6";
    return "#22c55e";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid background
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Streets
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 3;
    [0.2, 0.4, 0.6, 0.8].forEach((ratio) => {
      ctx.beginPath();
      ctx.moveTo(0, height * ratio);
      ctx.lineTo(width, height * ratio);
      ctx.stroke();
    });
    [0.25, 0.5, 0.75].forEach((ratio) => {
      ctx.beginPath();
      ctx.moveTo(width * ratio, 0);
      ctx.lineTo(width * ratio, height);
      ctx.stroke();
    });

    // Incident markers
    incidents.forEach((incident) => {
      const pos = latLngToPixel(
        incident.location.lat,
        incident.location.lng,
        width,
        height
      );

      const color = getSeverityColor(incident.severity);
      const isSelected = selectedIncident?.id === incident.id;
      const size = isSelected ? 16 : 12;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(
        pos.x,
        pos.y + size + 2,
        size * 0.5,
        size * 0.25,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Pin
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-size * 0.4, size * 0.6);
      ctx.lineTo(0, size * 1.8);
      ctx.lineTo(size * 0.4, size * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = "#800020";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, size + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [incidents, selectedIncident]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const incident of incidents) {
      const pos = latLngToPixel(
        incident.location.lat,
        incident.location.lng,
        canvas.width,
        canvas.height
      );

      const distance = Math.hypot(x - pos.x, y - pos.y);
      if (distance < 20) {
        onIncidentClick(incident);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let isOverIncident = false;
    for (const incident of incidents) {
      const pos = latLngToPixel(
        incident.location.lat,
        incident.location.lng,
        canvas.width,
        canvas.height
      );
      if (Math.hypot(x - pos.x, y - pos.y) < 20) {
        isOverIncident = true;
        break;
      }
    }

    canvas.style.cursor = isOverIncident ? "pointer" : "default";
  };

  return (
    <div className="relative w-full h-full bg-gray-100">
      {/* Map title */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-4 py-2">
        <div className="text-sm font-semibold text-[#800020]">
          Incident Overview Map
        </div>
        <div className="text-xs text-[#6B4423]">
          Displays all reported incidents by location
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      />

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3">
        <div className="text-xs text-[#6B4423] mb-2">Severity Legend</div>
        <div className="space-y-1">
          {[
            { level: 5, label: "Critical", color: "#dc2626" },
            { level: 4, label: "High", color: "#f97316" },
            { level: 3, label: "Medium", color: "#eab308" },
            { level: 2, label: "Low", color: "#3b82f6" },
            { level: 1, label: "Minimal", color: "#22c55e" },
          ].map(({ level, label, color }) => (
            <div key={level} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: color }}
              />
              <span className="text-[#6B4423]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2">
        <div className="text-xs text-[#6B4423]">
          📍 New York City Area • Click markers for details
        </div>
      </div>
    </div>
  );
}
