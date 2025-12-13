import type { Incident, IncidentType } from "../../types/incident";
import {
  Droplets,
  Mountain,
  Construction,
  Zap,
  AlertCircle,
  Shield,
  LogOut,
} from "lucide-react";

interface SummaryBadgesProps {
  incidents: Incident[];
  onLogout?: () => void;

  // ✅ optional navigation handlers (won't break existing usage)
  activeTab?: "home" | "accounts";
  onNavigate?: (tab: "home" | "accounts") => void;
}

export function SummaryBadges({
  incidents,
  onLogout,
  activeTab = "home",
  onNavigate,
}: SummaryBadgesProps) {
  const getCountByType = (type: IncidentType) =>
    incidents.filter((i) => i.type === type).length;

  const getCriticalCount = () => incidents.filter((i) => i.severity >= 4).length;

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
      <div className="bg-white rounded-lg shadow-md px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo + text */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>

            <div className="text-left leading-tight">
              <div className="text-[#4A1A1A] font-semibold text-lg">Nodus</div>
              <div className="text-muted-foreground font-semibold text-sm">
                Emergency Response System
              </div>
            </div>
          </div>

          {/* Middle: Navigation (cleaner segmented control) */}
          <div className="flex-1 flex items-center justify-center">
            <nav
              aria-label="Primary"
              className="inline-flex items-center rounded-xl border border-[#E5D5C3] bg-white shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => onNavigate?.("home")}
                className={[
                  "inline-flex items-center gap-2",
                  "px-4 py-2.5 text-sm font-semibold",
                  "transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#800020]/30 focus-visible:ring-offset-2",
                  activeTab === "home"
                    ? "bg-[#800020] text-white"
                    : "text-[#4A1A1A] hover:bg-[#FAF3E8]",
                ].join(" ")}
                aria-current={activeTab === "home" ? "page" : undefined}
              >
                Home
              </button>

              <span className="h-8 w-px bg-[#E5D5C3]" />

              <button
                type="button"
                onClick={() => onNavigate?.("accounts")}
                className={[
                  "inline-flex items-center gap-2",
                  "px-4 py-2.5 text-sm font-semibold",
                  "transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#800020]/30 focus-visible:ring-offset-2",
                  activeTab === "accounts"
                    ? "bg-[#800020] text-white"
                    : "text-[#4A1A1A] hover:bg-[#FAF3E8]",
                ].join(" ")}
                aria-current={activeTab === "accounts" ? "page" : undefined}
              >
                Accounts
              </button>
            </nav>
          </div>

          {/* Right: Logout (always visible) */}
          <button
            onClick={() => onLogout?.()}
            type="button"
            disabled={!onLogout}
            className={[
              "flex items-center gap-2",
              "text-[#800020] font-semibold text-sm",
              "px-4 py-2 rounded-lg",
              "border border-[#E5D5C3] bg-white", 
              "hover:bg-[#FAF3E8] transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#800020]/30 focus-visible:ring-offset-2",
              !onLogout ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Critical */}
        <div
          className={[
            "bg-white rounded-xl shadow-sm border border-[#E5D5C3]",
            "p-4 transition-all hover:shadow-md hover:-translate-y-[1px]",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>

            <div className="min-w-0">
              <div className="text-[26px] leading-none font-semibold text-[#4A1A1A]">
                {getCriticalCount()}
              </div>
              <div className="mt-1 text-sm font-medium text-[#6B4423]">
                Critical
              </div>
            </div>
          </div>

          <div className="mt-3 h-[3px] w-full rounded-full bg-red-100 overflow-hidden">
            <div className="h-full w-1/3 bg-red-600/70 rounded-full" />
          </div>
        </div>

        {/* Type badges */}
        {types.map((type) => (
          <div
            key={type}
            className={[
              "bg-white rounded-xl shadow-sm border border-[#E5D5C3]",
              "p-4 transition-all hover:shadow-md hover:-translate-y-[1px]",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#FAF3E8] border border-[#EFE5DA] p-3 rounded-xl text-[#800020]">
                {getIcon(type)}
              </div>

              <div className="min-w-0">
                <div className="text-[26px] leading-none font-semibold text-[#4A1A1A]">
                  {getCountByType(type)}
                </div>
                <div className="mt-1 text-sm font-medium text-[#6B4423] truncate">
                  {type}
                </div>
              </div>
            </div>

            <div className="mt-3 h-[3px] w-full rounded-full bg-[#F0E6D8] overflow-hidden">
              <div className="h-full w-1/3 bg-[#800020]/60 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
