// src/components/Can.tsx
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";

type Props = { perm: string; children: ReactNode };

export function Can({ perm, children }: Props) {
  const { can } = useAuth(); // vem do provider
  return can(perm) ? <>{children}</> : null;
}
