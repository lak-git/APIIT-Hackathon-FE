import type { Incident, IncidentType } from "../../types/incident";
import {
  Droplets,
  Mountain,
  Construction,
  Zap,
  AlertCircle,
  Shield,
} from "lucide-react";

interface SummaryBadgesProps {
  incidents: Incident[];
}

export function SummaryBadges({ incidents }: SummaryBadgesProps) {
  const getCountByType = (type: IncidentType) => {
    return incidents.filter((i) => i.type === type).length;
  };

  const getCriticalCount = () => {
    return incidents.filter((i) => i.severity >= 4).length;
  };

  const getIcon = (type: IncidentType) => {
    switch (type) {
      case "Flood":
        return <Droplets className="w-5 h-5" />;
      case "Landslide":
        return <Mountain className="w-5 h-5" />;
      case "Road Block":
        return <Construction className="w-5 h-5" />;
      case "Power Line Down":
        return <Zap className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const types: IncidentType[] = [
    "Flood",
    "Landslide",
    "Road Block",
    "Power Line Down",
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
            {/* Icon badge */}
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>

            {/* Text */}
            <div className="text-left">
              <div className="text-[#4A1A1A] font-semibold text-lg leading-tight">
                Nodus
              </div>
              <div className="text-muted-foreground font-semibold text-sm leading-tight">
                Emergency Response System
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Critical Incidents Badge */}
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-600">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              {/* 🔹 Semi-bold number */}
              <div className="text-2xl font-semibold text-[#4A1A1A]">
                {getCriticalCount()}
              </div>
              <div className="text-sm text-[#6B4423]">Critical</div>
            </div>
          </div>
        </div>

        {/* Type-specific badges */}
        {types.map((type) => (
          <div
            key={type}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#F0E6D8] p-3 rounded-lg text-[#800020]">
                {getIcon(type)}
              </div>
              <div>
                {/* 🔹 Semi-bold number */}
                <div className="text-2xl font-semibold text-[#4A1A1A]">
                  {getCountByType(type)}
                </div>
                <div className="text-sm text-[#6B4423]">{type}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
