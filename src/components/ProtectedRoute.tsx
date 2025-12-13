import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // Basic loading spinner or just null while checking auth
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login (root or emergency route which handles login)
        // Using replace to prevent going back to protected route
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
        // User is logged in but not an admin
        // Redirect to home (field responder view)
        return <Navigate to="/emergency" replace />;
    }

    return <>{children}</>;
}
