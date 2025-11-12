// src/components/guards/RequirePerm.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import type { ReactNode } from "react";

export function RequirePerm({
  perm,
  children,
}: {
  perm: string;
  children: ReactNode;
}) {
  const { can } = useAuth();
  if (!can(perm)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
