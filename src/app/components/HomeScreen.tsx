import { useEffect, useState } from "react";
import { FileText, Plus, Shield, ChevronRight, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ConnectivityBanner } from "./ConnectivityBanner";

import { IncidentMiniMap } from "./IncidentMiniMap";

interface HomeScreenProps {
  isOnline: boolean;
  pendingCount: number;
  onCreateIncident: () => void;
  onViewReports: () => void;
  onLogout: () => void;
  remoteIncidents?: any[];
  nearbyIncidents?: any[];
}

export function HomeScreen({
  isOnline,
  pendingCount,
  onCreateIncident,
  onViewReports,
  onLogout,
  remoteIncidents = [],
  nearbyIncidents = [],
}: HomeScreenProps) {
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);

  useEffect(() => {
    console.log(`[HomeScreen] Mounted. Incidents received: ${remoteIncidents.length}`);
  }, [remoteIncidents.length]);

  return (
    <div className="min-h-screen flex flex-col bg-white w-full">
      <ConnectivityBanner isOnline={isOnline} />

      <div className="flex-1 p-6 space-y-6">
        {/* Branding (black & white) */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-black rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>

          <div className="leading-tight">
            <div className="text-black font-semibold text-lg">Nodus</div>
            <div className="text-black/60 font-semibold text-sm">
              Emergency Response System
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-black">Field Responder</h1>
            <p className="text-black/60 m-0">Emergency Response Dashboard</p>
          </div>

          {/* Icon-only logout removed from here (moved to bottom button) */}
        </div>

        {/* Actions (cleaner + B/W) */}
        <div className="space-y-4">
          {/* Create Incident */}
          <Card className="p-0 overflow-hidden border border-black/10 bg-white shadow-sm">
            <Button
              onClick={onCreateIncident}
              size="lg"
              className={[
                "w-full h-auto p-5",
                "flex items-center justify-between",
                "rounded-none",
                "bg-black text-white hover:bg-black/90",
              ].join(" ")}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>

                <div className="leading-tight">
                  <div className="font-semibold">Create Incident Report</div>
                  <div className="text-sm text-white/80">
                    Record incidents on site
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 opacity-90 text-white" />
            </Button>
          </Card>

          {/* Pending Reports */}
          <Card className="p-0 overflow-hidden border border-black/10 bg-white shadow-sm">
            <Button
              onClick={onViewReports}
              variant="outline"
              size="lg"
              className={[
                "w-full h-auto p-5",
                "flex items-center justify-between",
                "rounded-none",
                "border-0",
                "bg-white hover:bg-black/5",
                "text-black",
              ].join(" ")}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-11 h-11 rounded-xl bg-white border border-black/10 flex items-center justify-center text-black">
                  <FileText className="w-6 h-6 text-black" />
                </div>

                <div className="leading-tight">
                  <div className="font-semibold">Pending Reports</div>
                  <div className="text-sm text-black/60">
                    Review & sync when online
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {pendingCount > 0 && (
                  <Badge className="h-7 min-w-[1.75rem] rounded-full px-2 bg-black text-white">
                    {pendingCount}
                  </Badge>
                )}
                <ChevronRight className="w-5 h-5 text-black/60" />
              </div>
            </Button>
          </Card>
        </div>

        {/* Nearby Incidents Alert - High Priority */}
        {nearbyIncidents.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Nearby Alerts
            </h2>
            <div className="space-y-3">
              {nearbyIncidents.map((incident: any) => (
                <Card key={`nearby-${incident.id}`} className="p-4 border-l-4 border-l-red-500 border-y border-r border-gray-200 shadow-sm bg-red-50/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-100">
                          Within 1km
                        </Badge>
                        <span className="text-xs text-red-600/70 font-medium">
                          {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium line-clamp-2">
                        {incident.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {incident.location.address || `${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}`}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setExpandedIncidentId(expandedIncidentId === incident.id ? null : incident.id)}
                      className={`
                        ml-3 p-2 rounded-lg border transition-all duration-200 flex-shrink-0
                        ${expandedIncidentId === incident.id 
                          ? 'bg-red-100 border-red-200 text-red-700' 
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                      `}
                      title="View on Map"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                  </div>

                  {expandedIncidentId === incident.id && (
                     <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <IncidentMiniMap incident={incident} />
                     </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Remote Active Incidents List */}
        <div>
          <h2 className="text-lg font-semibold text-black mb-4">Active Incidents</h2>
          <div className="space-y-3">
            {remoteIncidents.length === 0 ? (
              <p className="text-black/60 text-sm">No active incidents found.</p>
            ) : (
              remoteIncidents.map((incident: any) => (
                <Card key={incident.id} className="p-4 border border-black/10 shadow-sm bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="border-black/20 text-black">
                          {incident.type}
                        </Badge>
                        <span className="text-xs text-black/50">
                          {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-black/80 line-clamp-2">
                        {incident.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!incident.isRead ? (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Read
                        </Badge>
                      )}
                      <div className={`w-2 h-2 rounded-full ${incident.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Logout Button (full width) */}
      <div className="p-6 pt-0">
        <Button
          onClick={onLogout}
          className="w-full h-12 bg-black text-white hover:bg-black/90 flex items-center justify-center gap-2"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
