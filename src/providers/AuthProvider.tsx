
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Session, User } from "@supabase/supabase-js";
import { getUserProfile, login as apiLogin, logout as apiLogout } from "../app/services/authService";
import { useOnlineStatus } from "../app/hooks/useOnlineStatus";
import { storage } from "../app/utils/storage";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAdmin: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isAdmin: false,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isOnline = useOnlineStatus();

    // Load from local storage on mount (Optimistic Hydration)
    useEffect(() => {
        const loadSession = async () => {
            try {
                const cachedSession = localStorage.getItem("sb-session");
                const cachedUser = localStorage.getItem("sb-user");
                const cachedIsAdmin = localStorage.getItem("sb-isAdmin");

                if (cachedSession && cachedUser) {
                    setSession(JSON.parse(cachedSession));
                    setUser(JSON.parse(cachedUser));
                    setIsAdmin(cachedIsAdmin === "true");
                    setIsAuthenticated(true);
                }
            } catch (e) {
                console.error("Failed to load session from cache", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, []);

    // Sync with Supabase when online
    useEffect(() => {
        if (!isOnline) return;

        const syncAuth = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const hasLocalSession = localStorage.getItem("sb-session");

            if (currentSession && hasLocalSession) {
                // Valid session AND we intended to be logged in
                setSession(currentSession);
                setUser(currentSession.user);

                // Refresh admin status
                const profile = await getUserProfile(currentSession.user.id);
                const adminStatus = profile?.is_admin || false;
                setIsAdmin(adminStatus);

                // Update cache
                localStorage.setItem("sb-session", JSON.stringify(currentSession));
                localStorage.setItem("sb-user", JSON.stringify(currentSession.user));
                localStorage.setItem("sb-isAdmin", String(adminStatus));

                setIsAuthenticated(true);
            } else if (currentSession && !hasLocalSession) {
                // Supabase thinks we are logged in, but our local app says we logged out.
                // Force logout on Supabase to match local state.
                console.warn("Supabase session exists but local session missing. Forcing logout.");
                await supabase.auth.signOut();
                handleLogout(); // Ensure local state is clean
            } else {
                // Invalid session
                if (isAuthenticated) {
                    console.warn("Online but no Supabase session - clearing local session");
                    handleLogout();
                }
            }
        };

        syncAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                setSession(session);
                setUser(session.user);

                // We can't easily get isAdmin here without another fetch
                // But usually the syncAuth handles the initial load.
                localStorage.setItem("sb-session", JSON.stringify(session));
                localStorage.setItem("sb-user", JSON.stringify(session.user));

                // If we just logged in via Supabase (e.g. valid token), we might need to fetch profile if we don't have it.
                if (!isAdmin) {
                    const profile = await getUserProfile(session.user.id);
                    const adminStatus = profile?.is_admin || false;
                    setIsAdmin(adminStatus);
                    localStorage.setItem("sb-isAdmin", String(adminStatus));
                }

                setIsAuthenticated(true);
            } else {
                // Signed out
                // handleLogout();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    const handleLogin = async (email: string, password: string) => {
        if (!isOnline) {
            throw new Error("Cannot log in while offline. Please connect to the internet.");
        }

        // 1. Api Login
        const data = await apiLogin({ email, password });

        if (data.user && data.session) {
            // 2. Fetch Profile
            const profile = await getUserProfile(data.user.id);
            const adminStatus = profile?.is_admin || false;

            // 3. Update State
            setUser(data.user);
            setSession(data.session);
            setIsAdmin(adminStatus);
            setIsAuthenticated(true);

            // 4. Cache
            localStorage.setItem("sb-session", JSON.stringify(data.session));
            localStorage.setItem("sb-user", JSON.stringify(data.user));
            localStorage.setItem("sb-isAdmin", String(adminStatus));
        }
    };

    const handleLogout = async () => {
        // Optimistic Logout: Clear local state immediately for better UX
        // This ensures the user is "logged out" in the UI even if the server call hangs or fails (e.g. offline)
        localStorage.removeItem("sb-session");
        localStorage.removeItem("sb-user");
        localStorage.removeItem("sb-isAdmin");

        // Clear application specific storage (Field Responder data)
        // We import this dynamically or just use the storage object if imported
        // Ideally we should import { storage } from "../app/utils/storage";
        // But to avoid circular deps if any, we can check keys manually or import it.
        // Let's import it at the top.
        storage.clearAllData();

        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setIsAuthenticated(false);

        try {
            await apiLogout();
        } catch (e) {
            console.error("Logout error", e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            isAdmin,
            isAuthenticated,
            isLoading,
            login: handleLogin,
            logout: handleLogout
        }}>
            {children}
        </AuthContext.Provider>
    );
}
