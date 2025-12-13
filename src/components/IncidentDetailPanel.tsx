import React from 'react';
import { Incident } from '../types/incident';
import { X, MapPin, Clock, AlertTriangle, User } from 'lucide-react';

interface IncidentDetailPanelProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IncidentDetailPanel({ incident, isOpen, onClose }: IncidentDetailPanelProps) {
  if (!isOpen || !incident) return null;

  const getSeverityLabel = (severity: number) => {
    if (severity === 5) return { label: 'Critical', color: 'text-red-600 bg-red-100' };
    if (severity === 4) return { label: 'High', color: 'text-orange-600 bg-orange-100' };
    if (severity === 3) return { label: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
    if (severity === 2) return { label: 'Low', color: 'text-blue-600 bg-blue-100' };
    return { label: 'Minimal', color: 'text-green-600 bg-green-100' };
  };

  const severityInfo = getSeverityLabel(incident.severity);

  return (
    <div className="w-96 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between">
        <h2 className="text-xl">Incident Details</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Incident ID and Type */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[#6B4423]">{incident.id}</span>
            <span className={`px-3 py-1 rounded-full ${severityInfo.color}`}>
              Severity {incident.severity} - {severityInfo.label}
            </span>
          </div>
          <h3 className="text-2xl text-[#4A1A1A] mb-1">{incident.type}</h3>
          <div className={`inline-block px-2 py-1 rounded text-sm ${
            incident.status === 'Active' 
              ? 'bg-red-100 text-red-800'
              : incident.status === 'Responding'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {incident.status}
          </div>
        </div>

        {/* Image */}
        {incident.imageUrl && (
          <div className="rounded-lg overflow-hidden shadow-md">
            <img 
              src={incident.imageUrl} 
              alt={`${incident.type} incident`}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <h4 className="text-[#800020] mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Description
          </h4>
          <p className="text-[#6B4423] leading-relaxed">
            {incident.description}
          </p>
        </div>

        {/* Location */}
        <div className="bg-[#FAF3E8] rounded-lg p-3">
          <h4 className="text-[#800020] mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </h4>
          <p className="text-[#6B4423] mb-1">{incident.location.address}</p>
          <p className="text-[#6B4423]/60 text-sm font-mono">
            {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
          </p>
        </div>

        {/* Timestamp */}
        <div className="bg-[#FAF3E8] rounded-lg p-3">
          <h4 className="text-[#800020] mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Reported Time
          </h4>
          <p className="text-[#6B4423]">
            {incident.timestamp.toLocaleString()}
          </p>
        </div>

        {/* Reported By */}
        <div className="bg-[#FAF3E8] rounded-lg p-3">
          <h4 className="text-[#800020] mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Reported By
          </h4>
          <p className="text-[#6B4423]">{incident.reportedBy}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 p-4 bg-[#FAF3E8]">
        <button className="w-full bg-[#800020] text-white py-2 px-4 rounded-lg hover:bg-[#6B1B2B] transition-colors">
          Dispatch Response Team
        </button>
      </div>
    </div>
  );
}
