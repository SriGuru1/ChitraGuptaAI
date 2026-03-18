import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import App from "./App.tsx";
import { AuthProvider, useAuth } from "./context/AuthContext";

const queryClient = new QueryClient();

function RoleRedirect() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;
  const target = user.role === "teacher" ? "/teacher" : "/student";
  if (location.pathname === target) {
    return null;
  }
  return <Navigate to={target} replace />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RoleRedirect />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
