// src/pages/auth/Login.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

type FromState = { from?: { pathname: string } };

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@sas.local");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);

      const fromPath =
        (location.state as FromState | null)?.from?.pathname ?? "/";

      nav(fromPath, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha de autenticação";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border p-6 bg-white dark:bg-slate-900"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>

        <label className="grid gap-1">
          <span className="text-sm">Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Palavra-passe</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && <div className="text-sm text-rose-600">{error}</div>}

        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "A entrar..." : "Entrar"}
        </button>

        <p className="text-xs text-slate-500">
          Use as credenciais fornecidas pela Loja Social.
        </p>
      </form>
    </div>
  );
}
