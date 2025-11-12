// src/contexts/auth-context.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as bcrypt from "bcryptjs";
import { api } from "@/lib/api";

/* ===== Tipos ===== */
export type Role = "ADMIN" | "STAFF" | "VIEWER";
export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  passwordHash?: string;
  createdAt?: string;
  lastLoginAt?: string | null;
};
export type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  can: (perm: string) => boolean;
};
// compat (se nalgum sítio importares este nome)
export type AuthContextType = AuthContextValue;

/* ===== RBAC ===== */
const RBAC: Record<Role, string[]> = {
  ADMIN: [
    "users:read",
    "users:write",
    "donations:*",
    "inventory:*",
    "schedules:*",
    "reports:*",
    "dashboard:*",
  ],
  STAFF: [
    "donations:*",
    "inventory:read",
    "inventory:write",
    "schedules:*",
    "dashboard:*",
    "reports:read",
  ],
  VIEWER: [
    "donations:read",
    "inventory:read",
    "schedules:read",
    "dashboard:*",
    "reports:read",
  ],
};

/* ===== Contexto ===== */
// cria com tipo concreto e usa non-null assertion no hook
const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

/* ===== Provider ===== */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("auth:user");
    if (raw) {
      try {
        setUser(JSON.parse(raw) as AppUser);
      } catch {
        localStorage.removeItem("auth:user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.get<AppUser[]>("/users", { params: { email } });
    const u = (res.data ?? [])[0];
    if (!u || u.isActive === false) throw new Error("Credenciais inválidas");
    const ok = u.passwordHash
      ? await bcrypt.compare(password, u.passwordHash)
      : false;
    if (!ok) throw new Error("Credenciais inválidas");

    const updated: AppUser = { ...u, lastLoginAt: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem("auth:user", JSON.stringify(updated));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth:user");
  };

  const hasRole = (...roles: Role[]) => !!user && roles.includes(user.role);
  const can = (perm: string) => {
    if (!user) return false;
    const perms = RBAC[user.role] ?? [];
    return perms.some(
      (p) =>
        p === perm ||
        (p.endsWith(":*") && perm.startsWith(p.slice(0, -2) + ":"))
    );
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, hasRole, can }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ===== Hook (sem erro de tipos) ===== */
export function useAuth(): AuthContextValue {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return useContext(AuthContext)!;
}
