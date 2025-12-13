import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { LoginScreen } from "./components/LoginScreen";
import { HomeScreen } from "./components/HomeScreen";
import { CreateIncidentScreen } from "./components/CreateIncidentScreen";

import { PendingReportsScreen } from "./components/PendingReportsScreen";
import CommandDashboardRoute from "../routes/CommandDashboardRoute";

import { useIncidentData } from "../providers/IncidentProvider";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { usePWAInstallPrompt } from "./hooks/usePWAInstallPrompt";
import { useLiveQuery } from "dexie-react-hooks";
import { storage } from "./utils/storage";
import { db, type IncidentReport } from "../db/db";
import { useAuth } from "../providers/AuthProvider";

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

type Screen = "login" | "home" | "create" | "reports" | "dashboard";

const MAROON = "#800020";
const WHITE = "#FFFFFF";
const BORDER = "#E5E5E5";

/**
 * One consistent toast style for the whole app:
 * - White background
 * - Maroon text + icon
 */
function toastMaroon(
  message: string,
  opts?: {
    icon?: React.ReactNode;
    description?: string;
  },
) {
  toast(message, {
    description: opts?.description,
    icon: opts?.icon,
    style: {
      background: WHITE,
      color: MAROON,
      border: `1px solid ${BORDER}`,
    },
  });
}

export default function EmergencyResponseRoute() {
  const { isAuthenticated, isAdmin, login, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [installBannerDismissed, setInstallBannerDismissed] = useState(false);

  const reports = useLiveQuery(() => db.reports.toArray()) ?? [];
  const isOnline = useOnlineStatus();
  const { sync } = useIncidentData();
  const { canInstall: canInstallPWA, promptInstall, dismissPrompt } = usePWAInstallPrompt();
  const shouldShowInstallBanner = canInstallPWA && !installBannerDismissed;

  // Icons pre-built (maroon)
  const icons = useMemo(
    () => ({
      success: <CheckCircle2 size={18} color={MAROON} />,
      info: <Info size={18} color={MAROON} />,
      error: <XCircle size={18} color={MAROON} />,
      saved: <Save size={18} color={MAROON} />,
      login: <LogIn size={18} color={MAROON} />,
      logout: <LogOut size={18} color={MAROON} />,
      retry: <RefreshCw size={18} color={MAROON} />,
      online: <Wifi size={18} color={MAROON} />,
      offline: <WifiOff size={18} color={MAROON} />,
    }),
    [],
  );

  useEffect(() => {
    if (isAuthenticated) {
      // Only redirect if we are currently on the login screen
      if (currentScreen === "login") {
        setCurrentScreen(isAdmin ? "dashboard" : "home");
      }
    } else {
      setCurrentScreen("login");
    }
  }, [isAuthenticated, isAdmin, currentScreen]);

  // NOTE: Reports are now automatically synced to IncidentProvider via its internal useLiveQuery.
  // We don't need to manually register them here anymore.

  useEffect(() => {
    // Auto-sync when coming online
    if (isOnline) {
      const unsyncedReports = reports.filter(
        (r) => r.status === "local" || r.status === "pending" || r.status === "failed",
      );

      if (unsyncedReports.length > 0) {
        toastMaroon("Online - syncing reports...", { icon: icons.online });
        syncReports();
      }
    } else {
      // Optional: show offline message (remove if you don't want it)
      // toastMaroon("Offline mode enabled", { icon: icons.offline });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      toastMaroon("Logged in successfully", { icon: icons.login });
    } catch (e) {
      console.error(e);
      toastMaroon("Login failed", { icon: icons.error });
    }
  };

  const handleLogout = async () => {
    await logout();
    storage.clearAuthToken();
    storage.clearUser();

    // State update handles via useEffect
    toastMaroon("Logged out", { icon: icons.logout });
  };

  const handleInstallPWA = async () => {
    const choice = await promptInstall();

    if (!choice) {
      toastMaroon("Install prompt unavailable", { icon: icons.info });
      return;
    }

    if (choice.outcome === "accepted") {
      toastMaroon("Installing Nodus...", { icon: icons.success });
    } else {
      toastMaroon("Install dismissed", { icon: icons.info });
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

    // ✅ Report saved locally (white bg, maroon text + maroon icon)
    toastMaroon("Report saved locally", { icon: icons.saved });

    setCurrentScreen("home");

    // Attempt to sync if online
    if (isOnline) {
      sync();
    }
  };


  const syncReports = async () => {
    if (!isOnline) {
      toastMaroon("Cannot sync while offline", { icon: icons.offline });
      return;
    }

    const unsyncedReports = reports.filter(
      (r) => r.status === "local" || r.status === "pending" || r.status === "failed",
    );

    if (unsyncedReports.length === 0) {
      toastMaroon("All reports are already synced", { icon: icons.success });
      return;
    }

    toastMaroon("Syncing reports...", { icon: icons.online });
    await sync();
  };

  const handleRetrySync = async () => {
    if (!isOnline) {
      toastMaroon("Cannot retry while offline", { icon: icons.offline });
      return;
    }

    toastMaroon("Retrying sync...", { icon: icons.retry });
    await sync();
  };

  const pendingCount = reports.filter((r) => r.status !== "synced").length;

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
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div>
            <p style={{ fontWeight: 600, color: MAROON }}>Install Nodus for offline access</p>
            <p style={{ margin: 0, color: "#4A4A4A" }}>
              Add the dashboard to your device for faster incident reporting.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleInstallPWA}
              style={{
                background: MAROON,
                color: WHITE,
                border: "none",
                borderRadius: 9999,
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
                color: MAROON,
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
          onRetry={() => handleRetrySync()}
        />
      )}

      {currentScreen === "dashboard" && <CommandDashboardRoute />}
    </>
  );
}
