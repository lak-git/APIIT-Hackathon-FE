import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { LoginScreen } from "./components/LoginScreen";
import { HomeScreen } from "./components/HomeScreen";
import { CreateIncidentScreen } from "./components/CreateIncidentScreen";

import { PendingReportsScreen } from "./components/PendingReportsScreen";

import { useAuth } from "../providers/AuthProvider";
import { useIncidentData } from "../providers/IncidentProvider";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { usePWAInstallPrompt } from "./hooks/usePWAInstallPrompt";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type IncidentReport } from "../db/db";
import { storage } from "./utils/storage";
import { getCurrentUser, getUserProfile } from "./services/authService";

import {
  CheckCircle2,
  Info,
  LogIn,
  LogOut,
  RefreshCw,
  Save,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

type Screen = "login" | "home" | "create" | "reports";

// ✅ Maroon -> Black
const BLACK = "#000000";
// ✅ Beige -> White
const WHITE = "#FFFFFF";
const BORDER = "#E5E5E5";

/**
 * One consistent toast style for the whole app:
 * - White background
 * - Black text + icon
 */
function toastBlack(
  message: string,
  opts?: {
    icon?: React.ReactNode;
    description?: string;
    id?: string | number;
  },
) {
  toast(message, {
    id: opts?.id,
    description: opts?.description,
    icon: opts?.icon,
    position: "bottom-center",
    style: {
      background: WHITE,
      color: BLACK,
      border: `1px solid ${BORDER}`,
    },
  });
}

import { useGeolocation } from "./hooks/useGeolocation";
import { calculateDistance } from "./utils/geo";

// ✅ Loading toast (syncing)
export default function EmergencyResponseRoute() {
  const { registerFieldIncident, incidents: activeIncidents } = useIncidentData();
  const { latitude, longitude } = useGeolocation();
  
  // Filter for nearby incidents (last 60 min, < 1km)
  const nearbyIncidents = useMemo(() => {
    if (!latitude || !longitude) return [];

    const now = new Date();
    const SIXTY_MINUTES_MS = 60 * 60 * 1000;

    return activeIncidents.filter((incident) => {
      // 1. Check time (last 60 mins)
      const timeDiff = now.getTime() - incident.timestamp.getTime();
      const isRecent = timeDiff >= 0 && timeDiff <= SIXTY_MINUTES_MS;

      if (!isRecent) return false;

      // 2. Check distance (< 1km)
      const distKm = calculateDistance(
        latitude,
        longitude,
        incident.location.lat,
        incident.location.lng
      );
      
      return distKm <= 1.0;
    });
  }, [activeIncidents, latitude, longitude]);
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [installBannerDismissed, setInstallBannerDismissed] = useState(false);

  const { isAuthenticated, isAdmin, isLoading, logout: authLogout } = useAuth();
  const navigate = useNavigate();




  const reports = useLiveQuery(() => db.reports.toArray()) ?? [];
  const isOnline = useOnlineStatus();

  const { canInstall: canInstallPWA, promptInstall, dismissPrompt } = usePWAInstallPrompt();
  const shouldShowInstallBanner = canInstallPWA && !installBannerDismissed;

  // Icons pre-built (black)
  const icons = useMemo(
    () => ({
      success: <CheckCircle2 size={18} color={BLACK} />,
      info: <Info size={18} color={BLACK} />,
      error: <XCircle size={18} color={BLACK} />,
      saved: <Save size={18} color={BLACK} />,
      login: <LogIn size={18} color={BLACK} />,
      logout: <LogOut size={18} color={BLACK} />,
      retry: <RefreshCw size={18} color={BLACK} />,
      online: <Wifi size={18} color={BLACK} />,
      offline: <WifiOff size={18} color={BLACK} />,
      syncing: <RefreshCw size={18} color={BLACK} className="animate-spin" />,
    }),
    [],
  );

  useEffect(() => {
    if (isLoading) return; // Wait for session check

    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/command", { replace: true });
      } else {
        setCurrentScreen((prev) => (prev === "login" ? "home" : prev));
      }
    } else {
      setCurrentScreen("login");
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);



  // NOTE: Reports are now automatically synced to IncidentProvider via its internal useLiveQuery.
  // We don't need to manually register them here anymore.

  useEffect(() => {
    if (isOnline) {
      const unsyncedReports = reports.filter(
        (r) =>
          r.status === "local" || r.status === "pending" || r.status === "failed",
      );

      if (unsyncedReports.length > 0) {
        toastBlack("Online - syncing reports...", { icon: icons.online });
        syncReports();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const handleLogin = async (email: string, _password: string) => {


    const user = await getCurrentUser();


    if (!user) return;

    // Set custom storage manually - why? AuthProvider does "sb-session"
    // storage.ts uses "field_responder_..."
    storage.setAuthToken("supabase-session");
    storage.setUser({ email, name: email.split("@")[0] });


    const profile = await getUserProfile(user.id);
    if (profile?.is_admin) {
      navigate("/command", { replace: true });
    } else {
      setCurrentScreen("home");
    }

    toastBlack("Logged in successfully", { icon: icons.login });
  };

  const handleLogout = async () => {
    await authLogout();
    toastBlack("Logged out", { icon: icons.logout });
  };

  const handleInstallPWA = async () => {
    const choice = await promptInstall();

    if (!choice) {
      toastBlack("Install prompt unavailable", { icon: icons.info });
      return;
    }

    if (choice.outcome === "accepted") {
      toastBlack("Installing Nodus...", { icon: icons.success });
    } else {
      toastBlack("Install dismissed", { icon: icons.info });
    }
  };

  const handleDismissInstallBanner = () => {
    dismissPrompt();
    setInstallBannerDismissed(true);
  };

  const handleSaveIncident = async (
    reportData: Omit<IncidentReport, "id" | "createdAt" | "status">,
  ) => {
    const newReport: IncidentReport = {
      ...reportData,
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: "local",
    };

    await db.reports.add(newReport);
    toastBlack("Report saved locally", { icon: icons.saved });
    setCurrentScreen("home");

    if (isOnline) {
      syncReports();
    }
  };

  const syncSingleReport = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report || !isOnline) return;

    // Update status to syncing
    await db.reports.update(reportId, { status: "syncing" });

    // Simulate API call
    setTimeout(async () => {
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        const syncedReport: IncidentReport = { ...report, status: "synced" };

        // React UI updates automatically via useLiveQuery
        registerFieldIncident(syncedReport, storage.getUser()?.name);

        // ✅ Report saved successfully / synced successfully
        toastBlack("Report synced successfully", { icon: icons.success });
      } else {
        await db.reports.update(reportId, { status: "failed" });

        toastBlack("Sync failed - will retry later", { icon: icons.error });
      }
    }, 2000);
  };

  const syncReports = async () => {
    if (!isOnline) {
      toastBlack("Cannot sync while offline", { icon: icons.offline });
      return;
    }

    const unsyncedReports = reports.filter(
      (r) =>
        r.status === "local" || r.status === "pending" || r.status === "failed",
    );

    if (unsyncedReports.length === 0) {
      toastBlack("All reports are already synced", { icon: icons.success });
      return;
    }

    // Sync each report
    for (const report of unsyncedReports) {
      syncSingleReport(report.id);
    }
  };

  const handleRetrySync = async (reportId: string) => {
    if (!isOnline) {
      toastBlack("Cannot retry while offline", { icon: icons.offline });
      return;
    }

    toastBlack("Retrying sync...", { icon: icons.retry });
    syncSingleReport(reportId);
  };

  const pendingCount = reports.filter((r) => r.status !== "synced").length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      {shouldShowInstallBanner && (
        <div
          style={{
            background: WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            display: "flex",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div>
            <p style={{ fontWeight: 600, color: BLACK, margin: 0 }}>
              Install Nodus
            </p>
            <p style={{ margin: 0, color: "#4A4A4A" }}>Report Immediately</p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleInstallPWA}
              style={{
                background: BLACK,
                color: WHITE,
                border: "none",
                borderRadius: 1000,
                padding: "8px 20px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Install
            </button>
            <button
              onClick={handleDismissInstallBanner}
              style={{
                background: "transparent",
                color: BLACK,
                border: `1px solid ${BORDER}`,
                borderRadius: 9999,
                padding: "8px 20px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {currentScreen === "home" && (
        <HomeScreen
          isOnline={isOnline}
          pendingCount={pendingCount}
          onCreateIncident={() => setCurrentScreen("create")}
          onViewReports={() => setCurrentScreen("reports")}
          onLogout={handleLogout}
          remoteIncidents={activeIncidents}
          nearbyIncidents={nearbyIncidents}
        />
      )}

      {currentScreen === "create" && (
        <CreateIncidentScreen
          isOnline={isOnline}
          onBack={() => setCurrentScreen("home")}
          onSave={handleSaveIncident}
        />
      )}

      {currentScreen === "reports" && (
        <PendingReportsScreen
          isOnline={isOnline}
          reports={reports}
          onBack={() => setCurrentScreen("home")}
          onSync={syncReports}
          onRetry={handleRetrySync}
        />
      )}
    </>
  );
}
