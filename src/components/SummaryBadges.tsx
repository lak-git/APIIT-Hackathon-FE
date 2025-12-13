import React from 'react';
import { Incident, IncidentType } from '../types/incident';
import { Droplets, Mountain, Construction, Zap, AlertCircle } from 'lucide-react';

interface SummaryBadgesProps {
  incidents: Incident[];
}

export function SummaryBadges({ incidents }: SummaryBadgesProps) {
  const getCountByType = (type: IncidentType) => {
    return incidents.filter(i => i.type === type).length;
  };

  const getCriticalCount = () => {
    return incidents.filter(i => i.severity >= 4).length;
  };

  const getIcon = (type: IncidentType) => {
    switch (type) {
      case 'Flood':
        return <Droplets className="w-5 h-5" />;
      case 'Landslide':
        return <Mountain className="w-5 h-5" />;
      case 'Road Block':
        return <Construction className="w-5 h-5" />;
      case 'Power Line Down':
        return <Zap className="w-5 h-5" />;
    }
  };

  const types: IncidentType[] = ['Flood', 'Landslide', 'Road Block', 'Power Line Down'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Critical Incidents Badge */}
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-600">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-2xl text-[#4A1A1A]">{getCriticalCount()}</div>
            <div className="text-sm text-[#6B4423]">Critical</div>
          </div>
        </div>
      </div>

      {/* Type-specific badges */}
      {types.map((type) => (
        <div key={type} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-[#F0E6D8] p-3 rounded-lg text-[#800020]">
              {getIcon(type)}
            </div>
            <div>
              <div className="text-2xl text-[#4A1A1A]">{getCountByType(type)}</div>
              <div className="text-sm text-[#6B4423]">{type}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}