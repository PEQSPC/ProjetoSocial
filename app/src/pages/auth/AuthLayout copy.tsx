// src/pages/auth/AuthLayout.tsx
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen relative">
      {/* Fundo (gradiente) */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800" />
      {/* Overlay para contraste */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Conteúdo centrado */}
      <div className="relative z-10 min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-md">
          {/* Cartão */}
          <div className="rounded-2xl border border-white/15 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl p-6">
            <div className="mb-4">
              <h1 className="text-xl font-semibold leading-tight">
                Loja Social
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Aceda ao backoffice
              </p>
            </div>

            {/* O formulário de Login entra aqui */}
            <Outlet />
          </div>

          <p className="mt-3 text-center text-xs text-white/80">
            © {new Date().getFullYear()} Loja Social — SAS/IPCA
          </p>
        </div>
      </div>
    </div>
  );
}
