import { FileText, Plus, Shield, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ConnectivityBanner } from "./ConnectivityBanner";

interface HomeScreenProps {
  isOnline: boolean;
  pendingCount: number;
  onCreateIncident: () => void;
  onViewReports: () => void;
  onLogout: () => void;
}

export function HomeScreen({
  isOnline,
  pendingCount,
  onCreateIncident,
  onViewReports,
  onLogout,
}: HomeScreenProps) {
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
