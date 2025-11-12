import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { AppUser } from "@/contexts/auth-context";

export default function UsersList() {
  const [items, setItems] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get<AppUser[]>("/users?_sort=name&_order=asc");
      setItems(res.data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">A carregar…</div>;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Utilizadores
          </h1>
          <p className="text-sm text-slate-500">Gerir contas e permissões</p>
        </div>
        <Link to="/users/new" className="btn btn-primary">
          Novo utilizador
        </Link>
      </header>

      <div className="card p-0 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="p-3">Nome</th>
              <th className="p-3">Email</th>
              <th className="p-3">Papel</th>
              <th className="p-3">Ativo</th>
              <th className="p-3 w-0"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <span className="badge">{u.role}</span>
                </td>
                <td className="p-3">{u.isActive ? "Sim" : "Não"}</td>
                <td className="p-3 text-right">
                  <Link to={`/users/${u.id}`} className="btn btn-sm">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-6 text-sm text-slate-500" colSpan={5}>
                  Sem registos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
