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
import { useNearbyIncidents } from "./hooks/useNearbyIncidents";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type IncidentReport } from "../db/db";
import { useSyncManager } from "./hooks/useSyncManager";
// Auth is handled via AuthProvider - no direct service imports needed here
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

// ✅ Loading toast (syncing)
export default function EmergencyResponseRoute() {
    const { incidents: activeIncidents } = useIncidentData();
    const nearbyIncidents = useNearbyIncidents(activeIncidents);
    const [currentScreen, setCurrentScreen] = useState<Screen>("login");
    const [installBannerDismissed, setInstallBannerDismissed] = useState(false);

    const { isAuthenticated, isAdmin, isLoading, user, session, logout: authLogout, login: authLogin } = useAuth();
    const { sync } = useSyncManager(session);
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
            syncReports();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    const handleLogin = async (email: string, password: string) => {
        // Delegate to AuthProvider - it handles session, storage, and state updates
        await authLogin(email, password);
        // Navigation is handled by the useEffect that watches isAuthenticated/isAdmin
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
        reportData: Omit<IncidentReport, "id" | "createdAt" | "status" | "userId">,
    ) => {
        console.log("[EmergencyResponse] Saving incident. Current User:", user);

        const newReport: IncidentReport = {
            ...reportData,
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            status: "local",
            userId: user?.id || "anonymous",
        };

        console.log("[EmergencyResponse] New Report Object:", newReport);

        await db.reports.add(newReport);
        toastBlack("Report saved locally", { icon: icons.saved });
        setCurrentScreen("home");

        if (isOnline) {
            syncReports();
        }
    };

    const syncReports = async () => {
        if (!isOnline) {
            toastBlack("Cannot sync while offline", { icon: icons.offline });
            return;
        }
        
        // Trigger real sync via provider
        // useSyncManager handles the logic of ignoring offline users or empty queues
        await sync(); 
        
        // Optionally give feedback based on remaining count? 
        // But internal component state isn't exposed. 
        // We can just trust the toast from the useEffect or add a generic one.
    };

    const handleRetrySync = async (_reportId: string) => {
        if (!isOnline) {
            toastBlack("Cannot retry while offline", { icon: icons.offline });
            return;
        }

        toastBlack("Retrying sync...", { icon: icons.retry });
        await sync(); // Sync all pending
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