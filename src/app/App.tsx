import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { LoginScreen } from "./components/LoginScreen";
import { HomeScreen } from "./components/HomeScreen";
import { CreateIncidentScreen } from "./components/CreateIncidentScreen";
import { PendingReportsScreen } from "./components/PendingReportsScreen";

import { useIncidentData } from "../providers/IncidentProvider";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useLiveQuery } from "dexie-react-hooks";
import { storage } from "./utils/storage";
import { db, type IncidentReport } from "../db/db";

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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const reports = useLiveQuery(() => db.reports.toArray()) ?? [];
  const isOnline = useOnlineStatus();
  const { registerFieldIncident } = useIncidentData();

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
    // Check if user is already authenticated
    const token = storage.getAuthToken();
    if (token) {
      setIsAuthenticated(true);
      setCurrentScreen("home");
    }

    // Register synced reports from Dexie to the IncidentProvider
    reports
      .filter((report) => report.status === "synced")
      .forEach((report) => {
        registerFieldIncident(report, storage.getUser()?.name);
      });
  }, [registerFieldIncident, reports]);

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

  const handleLogin = (email: string, _password: string) => {
    // Mock authentication
    const mockToken = `token_${Date.now()}`;
    storage.setAuthToken(mockToken);
    storage.setUser({ email, name: email.split("@")[0] });

    setIsAuthenticated(true);
    setCurrentScreen("home");

    toastMaroon("Logged in successfully", { icon: icons.login });
  };

  const handleLogout = () => {
    storage.clearAuthToken();
    storage.clearUser();
    setIsAuthenticated(false);
    setCurrentScreen("login");

    toastMaroon("Logged out", { icon: icons.logout });
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
      setTimeout(() => syncSingleReport(newReport.id), 1000);
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
        toastMaroon("Report synced successfully", { icon: icons.success });
      } else {
        await db.reports.update(reportId, { status: "failed" });

        toastMaroon("Sync failed - will retry later", { icon: icons.error });
      }
    }, 2000);
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

    // Sync each report
    for (const report of unsyncedReports) {
      syncSingleReport(report.id);
    }
  };

  const handleRetrySync = (reportId: string) => {
    if (!isOnline) {
      toastMaroon("Cannot retry while offline", { icon: icons.offline });
      return;
    }

    toastMaroon("Retrying sync...", { icon: icons.retry });
    syncSingleReport(reportId);
  };

  const pendingCount = reports.filter((r) => r.status !== "synced").length;

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
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
          onRetry={handleRetrySync}
        />
      )}
    </>
  );
}
