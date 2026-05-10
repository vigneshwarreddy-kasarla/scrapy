import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { token, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <p className="muted" role="status">
        Loading…
      </p>
    );
  }
  if (!token) {
    return <Navigate to="/401" replace state={{ from: loc.pathname }} />;
  }
  return children;
}
