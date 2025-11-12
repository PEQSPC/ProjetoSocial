import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AppUser } from "@/contexts/auth-context";

async function fetchUsers(q: string) {
  const params = q ? { q } : undefined; // json-server pesquisa em vários campos
  const res = await api.get<AppUser[]>("/users", { params });
  return res.data;
}

export default function UsersList() {
  const [q, setQ] = useState("");
  const usersQ = useQuery({
    queryKey: ["users", q],
    queryFn: () => fetchUsers(q),
  });

  const rows = useMemo(
    () => (usersQ.data ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    [usersQ.data]
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Utilizadores
          </h1>
          <p className="text-sm text-slate-500">
            Gestão de contas e permissões
          </p>
        </div>
        <Link to="/users/new" className="btn btn-primary">
          Novo utilizador
        </Link>
      </header>

      <div className="flex items-center gap-2">
        <input
          className="input max-w-sm"
          placeholder="Procurar por nome/email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {usersQ.isFetching && (
          <span className="text-xs text-slate-500">a carregar…</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2">Papel</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2 w-36"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2 text-center">
                  <span className="badge">{u.role}</span>
                </td>
                <td className="px-4 py-2 text-center">
                  {u.isActive ? (
                    <span className="badge bg-emerald-100 text-emerald-700">
                      Ativo
                    </span>
                  ) : (
                    <span className="badge bg-slate-200 text-slate-700">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link to={`/users/${u.id}`} className="btn btn-ghost">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !usersQ.isFetching && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Sem resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
