
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
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
