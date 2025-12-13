
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import App from "./App";
import EmergencyResponseRoute from "./app/EmergencyResponseRoute";
import CommandDashboardRoute from "./routes/CommandDashboardRoute";
import "./styles/index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/emergency" replace /> },
      { path: "emergency", element: <EmergencyResponseRoute /> },
      { path: "command", element: <CommandDashboardRoute /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
  