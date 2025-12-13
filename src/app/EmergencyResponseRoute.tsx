import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { LoginScreen } from "./components/LoginScreen";
import { HomeScreen } from "./components/HomeScreen";
import { CreateIncidentScreen } from "./components/CreateIncidentScreen";

import { PendingReportsScreen } from "./components/PendingReportsScreen";
import CommandDashboardRoute from "../routes/CommandDashboardRoute";

import { useIncidentData } from "../providers/IncidentProvider";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useLiveQuery } from "dexie-react-hooks";
import { storage } from "./utils/storage";
import { db, type IncidentReport } from "../db/db";
import { getCurrentUser, getUserProfile, logout } from "./services/authService";

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
      color: MAROON,
      border: `1px solid ${BORDER}`,
    },
  });
}

// ✅ Loading toast (syncing)
function toastMaroonLoading(
  message: string,
  opts?: {
    icon?: React.ReactNode;
    description?: string;
    id?: string | number;
  },
) {
  return toast.loading(message, {
    id: opts?.id,
    description: opts?.description,
    icon: opts?.icon,
    position: "bottom-center",
    style: {
      background: WHITE,
      color: MAROON,
      border: `1px solid ${BORDER}`,
    },
  });
}

export default function EmergencyResponseRoute() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const reports = useLiveQuery(() => db.reports.toArray()) ?? [];
  const isOnline = useOnlineStatus();
  const { registerFieldIncident } = useIncidentData();

  // ✅ Sync progress tracking (for bottom popup)
  const syncToastIdRef = useRef<string | number | null>(null);
  const syncPendingCountRef = useRef(0);

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
      syncing: <RefreshCw size={18} color={MAROON} className="animate-spin" />,
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
  }, []);

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

  const handleLogin = async (email: string, _password: string) => {
    const user = await getCurrentUser();
    if (!user) return;

    storage.setAuthToken("supabase-session");
    storage.setUser({ email, name: email.split("@")[0] });

    setIsAuthenticated(true);

    // Fetch profile and direct
    const profile = await getUserProfile(user.id);
    if (profile?.is_admin) {
      setCurrentScreen("dashboard");
    } else {
      setCurrentScreen("home");
    }

    toastMaroon("Logged in successfully", { icon: icons.login });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
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

  // ✅ Start/Update/Finish bottom sync popup
  const beginSyncPopup = (count: number) => {
    if (count <= 0) return;

    syncPendingCountRef.current += count;

    if (syncToastIdRef.current == null) {
      syncToastIdRef.current = toastMaroonLoading("Syncing reports…", {
        icon: icons.syncing,
        description: "Uploading your latest incident data.",
      });
    } else {
      toastMaroonLoading("Syncing reports…", {
        id: syncToastIdRef.current,
        icon: icons.syncing,
        description: `Uploading… ${syncPendingCountRef.current} remaining.`,
      });
    }
  };

  const finishOneSyncPopup = () => {
    syncPendingCountRef.current = Math.max(0, syncPendingCountRef.current - 1);

    if (syncToastIdRef.current == null) return;

    if (syncPendingCountRef.current > 0) {
      toastMaroonLoading("Syncing reports…", {
        id: syncToastIdRef.current,
        icon: icons.syncing,
        description: `Uploading… ${syncPendingCountRef.current} remaining.`,
      });
      return;
    }

    // ✅ Completed (update same toast)
    toastMaroon("Sync completed", {
      id: syncToastIdRef.current,
      icon: icons.success,
      description: "All pending reports are up to date.",
    });

    // Clear after a moment so the next sync starts fresh
    setTimeout(() => {
      syncToastIdRef.current = null;
      syncPendingCountRef.current = 0;
    }, 1200);
  };

  const syncSingleReport = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report || !isOnline) return;

    // ✅ Show syncing popup (1 item)
    beginSyncPopup(1);

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

      // ✅ Mark one item done (success or fail)
      finishOneSyncPopup();
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

    // ✅ Show syncing popup (bulk count)
    beginSyncPopup(unsyncedReports.length);

    // Sync each report
    for (const report of unsyncedReports) {
      // IMPORTANT: syncSingleReport already calls beginSyncPopup(1),
      // so we avoid double-counting by calling a version that DOESN'T add again.
      // We'll directly perform the existing logic by calling syncSingleReport,
      // but first undo the +1 it will add, then let it proceed.
      // Simpler: call syncSingleReport but prevent double-add by not calling beginSyncPopup here per-item.
      // We already added total above, so we should call a lightweight per-item sync.

      // ---- per-item without beginSyncPopup ----
      const reportId = report.id;

      const current = reports.find((r) => r.id === reportId);
      if (!current) {
        finishOneSyncPopup();
        continue;
      }

      await db.reports.update(reportId, { status: "syncing" });

      setTimeout(async () => {
        const success = Math.random() > 0.1;

        if (success) {
          const syncedReport: IncidentReport = { ...current, status: "synced" };
          registerFieldIncident(syncedReport, storage.getUser()?.name);
          toastMaroon("Report synced successfully", { icon: icons.success });
        } else {
          await db.reports.update(reportId, { status: "failed" });
          toastMaroon("Sync failed - will retry later", { icon: icons.error });
        }

        finishOneSyncPopup();
      }, 2000);
      // ---- end per-item without beginSyncPopup ----
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

      {currentScreen === "dashboard" && <CommandDashboardRoute />}
    </>
  );
}
