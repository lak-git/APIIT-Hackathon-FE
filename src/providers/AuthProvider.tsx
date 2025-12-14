
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import type { Session, User } from "@supabase/supabase-js";
import { getUserProfile, login as apiLogin, logout as apiLogout, signup as apiSignup, type SignupData } from "../app/services/authService";
import { useOnlineStatus } from "../app/hooks/useOnlineStatus";
import { storage } from "../app/utils/storage";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAdmin: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: SignupData) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isAdmin: false,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    signup: async () => { },
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

    // Ref to prevent onAuthStateChange from competing with syncAuth
    const syncInProgressRef = useRef(false);

    // Load from local storage on mount (Optimistic Hydration + Client Restoration)
    useEffect(() => {
        const loadSession = async () => {
            try {
                const cachedSession = localStorage.getItem("sb-session");
                const cachedUser = localStorage.getItem("sb-user");
                const cachedIsAdmin = localStorage.getItem("sb-isAdmin");

                if (cachedSession && cachedUser) {
                    const parsedUser = JSON.parse(cachedUser);
                    const parsedSession = JSON.parse(cachedSession);

                    // ALWAYS check verification status before restoring session (if online)
                    if (navigator.onLine && parsedUser.id !== 'offline-user') {
                        console.log("[AuthProvider] Checking cached user verification status...");
                        const profile = await getUserProfile(parsedUser.id);
                        console.log("[AuthProvider] Cached user profile:", profile);

                        if (!profile || profile.verification_status !== 'approved') {
                            console.warn("[AuthProvider] Cached user NOT approved. Clearing session and NOT authenticating.");
                            localStorage.removeItem("sb-session");
                            localStorage.removeItem("sb-user");
                            localStorage.removeItem("sb-isAdmin");
                            // Sign out from Supabase too
                            await supabase.auth.signOut();
                            setIsLoading(false);
                            return; // DO NOT SET isAuthenticated
                        }

                        // User is approved - restore session
                        console.log("[AuthProvider] Cached user APPROVED. Restoring session.");
                        setSession(parsedSession);
                        setUser(parsedUser);
                        setIsAdmin(cachedIsAdmin === "true");
                        setIsAuthenticated(true);
                    } else {
                        // Offline - temporarily allow cached session
                        console.log("[AuthProvider] Offline - allowing cached session temporarily");
                        setSession(parsedSession);
                        setUser(parsedUser);
                        setIsAdmin(cachedIsAdmin === "true");
                        setIsAuthenticated(true);
                    }
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
            syncInProgressRef.current = true;
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const hasLocalSession = localStorage.getItem("sb-session");

            // 1. Check for Pending Offline Credentials (User logged in while offline)
            const pendingCreds = localStorage.getItem("sb-pending-creds");
            if (pendingCreds && isOnline) {
                console.log("[AuthProvider] Found pending offline credentials. Attempting login...");
                try {
                    const { email, password } = JSON.parse(atob(pendingCreds));
                    // Check if we are already logged in with a real session that matches?
                    // Unlikely if pendingCreds exists.

                    const data = await apiLogin({ email, password });
                    if (data.user && data.session) {
                        console.log("[AuthProvider] Offline login synced successfully.");

                        // Update Profile & State
                        const profile = await getUserProfile(data.user.id);

                        // Check if user is approved
                        if (profile?.verification_status !== 'approved') {
                            console.warn("[AuthProvider] Offline sync user is not approved. Logging out.");
                            await apiLogout();
                            localStorage.removeItem("sb-pending-creds");
                            handleLogout("Account not approved");
                            return;
                        }

                        const adminStatus = profile?.is_admin || false;

                        setUser(data.user);
                        setSession(data.session);
                        setIsAdmin(adminStatus);
                        setIsAuthenticated(true);

                        // Update Cache
                        localStorage.setItem("sb-session", JSON.stringify(data.session));
                        localStorage.setItem("sb-user", JSON.stringify(data.user));
                        localStorage.setItem("sb-isAdmin", String(adminStatus));

                        // Clear pending
                        localStorage.removeItem("sb-pending-creds");
                        return; // Successfully synced, skip the rest of restore logic
                    }
                } catch (e) {
                    console.error("[AuthProvider] Failed to sync offline login:", e);
                    localStorage.removeItem("sb-pending-creds");
                    handleLogout("Offline sync failed (Invalid Credentials)");
                    return;
                }
            }




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
            } else if (!currentSession && hasLocalSession) {
                // Supabase client lost session (e.g. reload), but we have it locally.
                // Attempt to restore it.
                console.warn("[AuthProvider] Session mismatch: Local exists, Supabase missing. Attempting restore.");
                try {
                    const parsedSession = JSON.parse(hasLocalSession);
                    const { data, error } = await supabase.auth.setSession({
                        access_token: parsedSession.access_token,
                        refresh_token: parsedSession.refresh_token,
                    });

                    if (data.session) {
                        console.log("[AuthProvider] Session restored successfully");
                        setSession(data.session);
                        setUser(data.session.user);
                        setIsAuthenticated(true);
                    } else {
                        console.error("[AuthProvider] Failed to restore session. Error:", error);
                        handleLogout("Restore failed (syncAuth)");
                    }
                } catch (e) {
                    console.error("[AuthProvider] Error parsing local session during restore", e);
                    handleLogout("JSON parse error (syncAuth)");
                }
            } else if (currentSession && !hasLocalSession) {
                // Supabase thinks we are logged in, but our local app says we logged out.
                // This means the user intentionally logged out but Supabase session wasn't cleared.
                // We should sign out from Supabase to respect the user's logout intent.
                console.warn("[AuthProvider] Supabase session exists but local session missing. Signing out from Supabase.");
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    console.error("[AuthProvider] Failed to sign out from Supabase", e);
                }
                // Ensure local state is cleared
                setUser(null);
                setSession(null);
                setIsAdmin(false);
                setIsAuthenticated(false);
            } else {
                // Invalid session
                if (isAuthenticated) {
                    console.error("[AuthProvider] Online but no Supabase session - clearing local session");
                    handleLogout("No session syncAuth");
                }
            }
        };

        syncAuth().finally(() => {
            syncInProgressRef.current = false;
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // Skip if syncAuth is handling the auth state
            if (syncInProgressRef.current) {
                console.log("[AuthProvider] onAuthStateChange skipped - syncAuth in progress");
                return;
            }

            if (session) {
                // Prevent redundant updates if session hasn't changed
                setSession((prev) => {
                    if (prev?.access_token === session.access_token) return prev;
                    return session;
                });
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
                // handleLogout(); // careful with infinite loops if handleLogout calls cleanups that trigger this
            }
        });

        return () => {
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    const handleLogin = async (email: string, password: string) => {
        if (!isOnline) {
            console.warn("[AuthProvider] Offline login initiated.");

            // Create Temporary Offline User
            const offlineUser: User = {
                id: "offline-user",
                app_metadata: {},
                user_metadata: {},
                aud: "authenticated",
                created_at: new Date().toISOString(),
                email: email,
                phone: "",
                role: "authenticated",
                updated_at: new Date().toISOString()
            };

            // Simulating Session (Mock)
            const offlineSession: Session = {
                access_token: "offline-token",
                token_type: "bearer",
                expires_in: 3600,
                refresh_token: "offline-refresh",
                user: offlineUser,
            };

            // Store credentials for later sync (Simple Obfuscation)
            // WARNING: This is not secure storage. In a real production app, use secure storage or token caching.
            const encodedCreds = btoa(JSON.stringify({ email, password }));
            localStorage.setItem("sb-pending-creds", encodedCreds);

            // Update State
            setUser(offlineUser);
            setSession(offlineSession);
            setIsAuthenticated(true); // Allow access
            setIsAdmin(false); // Assume not admin offline for safety

            return;
        }

        // 1. Api Login
        const data = await apiLogin({ email, password });

        if (data.user && data.session) {
            // 2. Fetch Profile
            const profile = await getUserProfile(data.user.id);
            console.log("[AuthProvider] User profile:", profile);
            console.log("[AuthProvider] verification_status:", profile?.verification_status);

            // 3. Check if user is approved
            if (!profile || profile.verification_status !== 'approved') {
                // User is not approved - sign them out and reset all state
                console.warn("[AuthProvider] User NOT approved. Signing out and resetting state. Status:", profile?.verification_status);

                // Clear all auth state
                setUser(null);
                setSession(null);
                setIsAdmin(false);
                setIsAuthenticated(false);

                // Clear localStorage
                localStorage.removeItem("sb-session");
                localStorage.removeItem("sb-user");
                localStorage.removeItem("sb-isAdmin");

                // Sign out from Supabase
                await apiLogout();

                // Show appropriate error message based on status
                if (profile?.verification_status === 'rejected') {
                    throw new Error("Your account registration was rejected. Please contact the administrator for more information.");
                } else if (profile?.verification_status === 'pending') {
                    throw new Error("Your account is pending approval. Please wait for an administrator to approve your account.");
                } else {
                    throw new Error("Your account is not authorized to access this application.");
                }
            }

            const adminStatus = profile?.is_admin || false;

            // 4. Update State
            setUser(data.user);
            setSession(data.session);
            setIsAdmin(adminStatus);
            setIsAuthenticated(true);

            // 5. Cache
            localStorage.setItem("sb-session", JSON.stringify(data.session));
            localStorage.setItem("sb-user", JSON.stringify(data.user));
            localStorage.setItem("sb-isAdmin", String(adminStatus));
        }
    };

    const handleLogout = async (reason = "User initiated") => {
        console.error(`[AuthProvider] Logout triggered. Reason: ${reason}`);
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

    const handleSignup = async (data: SignupData) => {
        if (!isOnline) {
            throw new Error("Cannot sign up while offline. Please connect to the internet.");
        }

        // Call signup API (creates user + profile)
        const authData = await apiSignup(data);

        if (authData.user) {
            // Note: New users need email verification in most Supabase setups
            // They won't have a session until verified, so we don't set isAuthenticated
            console.log("[AuthProvider] User signed up successfully. Email verification may be required.");
        }
    };

    // Memoize the context value to prevent unnecessary re-renders
    const value = React.useMemo(() => ({
        user,
        session,
        isAdmin,
        isAuthenticated,
        isLoading,
        login: handleLogin,
        signup: handleSignup,
        logout: () => handleLogout("User action")
    }), [user, session, isAdmin, isAuthenticated, isLoading, isOnline]); // Added isOnline as handleLogin uses it, though handleLogin is not memoized itself (it should be)



    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
