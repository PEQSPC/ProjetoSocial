// src/components/guards/RequireAuth.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import type { ReactNode } from "react";

type Props = { children: ReactNode };

export function RequireAuth({ children }: Props) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  return <>{children}</>;
}
