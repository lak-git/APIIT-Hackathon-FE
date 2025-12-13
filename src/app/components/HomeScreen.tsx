import { FileText, Plus, LogOut, Shield, ChevronRight } from "lucide-react";
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
    <div className="min-h-screen flex flex-col">
      <ConnectivityBanner isOnline={isOnline} />

      <div className="flex-1 p-6 space-y-6">
        {/* Branding (no background, left-aligned) */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>

          <div className="leading-tight">
            <div className="text-[#4A1A1A] font-semibold text-lg">Nodus</div>
            <div className="text-muted-foreground font-semibold text-sm">
              Emergency Response System
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2">Field Responder</h1>
            <p className="text-muted-foreground m-0">
              Emergency Response Dashboard
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Actions (cleaner + more professional) */}
        <div className="space-y-4">
          {/* Create Incident */}
          <Card className="p-0 overflow-hidden border border-[#E5D5C3] bg-white shadow-sm">
            <Button
              onClick={onCreateIncident}
              size="lg"
              className={[
                "w-full h-auto p-5",
                "flex items-center justify-between",
                "rounded-none",
              ].join(" ")}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>

                <div className="leading-tight">
                  <div className="font-semibold">Create Incident Report</div>
                  <div className="text-sm text-primary-foreground/80">
                    Record incidents on site
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 opacity-90" />
            </Button>
          </Card>

          {/* Pending Reports */}
          <Card className="p-0 overflow-hidden border border-[#E5D5C3] bg-white shadow-sm">
            <Button
              onClick={onViewReports}
              variant="outline"
              size="lg"
              className={[
                "w-full h-auto p-5",
                "flex items-center justify-between",
                "rounded-none",
                "border-0",
                "bg-white hover:bg-[#FAF3E8]",
                "text-[#800020]",
              ].join(" ")}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-11 h-11 rounded-xl bg-[#F0E6D8] flex items-center justify-center text-[#800020]">
                  <FileText className="w-6 h-6" />
                </div>

                <div className="leading-tight">
                  <div className="font-semibold">Pending Reports</div>
                  <div className="text-sm text-[#6B4423]">
                    Review & sync when online
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {pendingCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-7 min-w-[1.75rem] rounded-full px-2"
                  >
                    {pendingCount}
                  </Badge>
                )}
                <ChevronRight className="w-5 h-5 text-[#800020]/70" />
              </div>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
