
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import EmergencyResponseRoute from "./app/EmergencyResponseRoute";
import CommandDashboardRoute from "./routes/CommandDashboardRoute";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import "./styles/index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/emergency" replace /> },
      { path: "emergency", element: <EmergencyResponseRoute /> },
      {
        path: "command",
        element: (
          <ProtectedRoute requireAdmin={true}>
            <CommandDashboardRoute />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

// Ensure the Vite PWA service worker takes control of every route load.
// Ensure the Vite PWA service worker takes control of every route load.
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
} else {
  // In development, aggressive SW cleanup
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length > 0) {
        console.warn(`[Dev] Found ${registrations.length} stale service workers. Unregistering...`);
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            console.log(`[Dev] Unregister SW success: ${success}`);
            // Optional: Force reload if we found one, to ensure clean state
            // window.location.reload(); 
          });
        }
      } else {
        console.log("[Dev] No stale service workers found.");
      }
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
