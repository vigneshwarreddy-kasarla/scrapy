import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminRoute({ children }: { children: ReactElement }) {
  const { loading, user } = useAuth();
  if (loading) return <p className="muted">Loading…</p>;
  if (!user) return <Navigate to="/401" replace />;
  if (user.role !== "admin") return <Navigate to="/403" replace />;
  return children;
}
