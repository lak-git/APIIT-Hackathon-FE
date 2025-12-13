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

  const getCriticalCount = () =>
    incidents.filter((i) => i.severity >= 4).length;

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
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>

            <div className="text-left leading-tight">
              <div className="text-black font-semibold text-lg">Nodus</div>
              <div className="text-gray-600 font-semibold text-sm">
                Emergency Response System
              </div>
            </div>
          </div>

          {/* Middle: Navigation */}
          <div className="flex-1 flex items-center justify-center">
            <nav
              aria-label="Primary"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => onNavigate?.("home")}
                className={[
                  "px-4 py-2.5 text-sm font-semibold transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2",
                  activeTab === "home"
                    ? "bg-black text-white"
                    : "text-black hover:bg-gray-100",
                ].join(" ")}
                aria-current={activeTab === "home" ? "page" : undefined}
              >
                Home
              </button>

              <span className="h-8 w-px bg-gray-300" />

              <button
                type="button"
                onClick={() => onNavigate?.("accounts")}
                className={[
                  "px-4 py-2.5 text-sm font-semibold transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2",
                  activeTab === "accounts"
                    ? "bg-black text-white"
                    : "text-black hover:bg-gray-100",
                ].join(" ")}
                aria-current={activeTab === "accounts" ? "page" : undefined}
              >
                Accounts
              </button>
            </nav>
          </div>

          {/* Right: Logout */}
          <button
            onClick={() => onLogout?.()}
            type="button"
            disabled={!onLogout}
            className={[
              "flex items-center gap-2",
              "bg-black text-white font-semibold text-sm",
              "px-4 py-2 rounded-lg",
              "border border-black",
              "hover:bg-gray-900 transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            Logout
          </button>

        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Critical */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-4 transition-all hover:shadow-md hover:-translate-y-[1px]">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>

            <div className="min-w-0">
              <div className="text-[26px] leading-none font-semibold text-black">
                {getCriticalCount()}
              </div>
              <div className="mt-1 text-sm font-medium text-gray-600">
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
            className="bg-white rounded-xl shadow-sm border border-gray-300 p-4 transition-all hover:shadow-md hover:-translate-y-[1px]"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white border border-gray-200 p-3 rounded-xl text-black">
                {getIcon(type)}
              </div>

              <div className="min-w-0">
                <div className="text-[26px] leading-none font-semibold text-black">
                  {getCountByType(type)}
                </div>
                <div className="mt-1 text-sm font-medium text-gray-600 truncate">
                  {type}
                </div>
              </div>
            </div>

            <div className="mt-3 h-[3px] w-full rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full w-1/3 bg-black/60 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
