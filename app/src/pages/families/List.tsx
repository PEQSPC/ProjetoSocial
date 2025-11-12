import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, PencilLine, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useFamilies, type FamiliesListParams } from "@/hooks/useFamilies";
import type { Family } from "@/domain/schemas";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p?.[0]?.toUpperCase() ?? "").join("");
}
function fmtDate(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(+dt) ? d : dt.toLocaleDateString("pt-PT");
}

export default function FamiliesList() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // pesquisa com debounce
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchRaw.trim()), 250);
    return () => clearTimeout(t);
  }, [searchRaw]);

  const [page, setPage] = useState(1);
  const limit = 10;

  // ⚠️ Estratégia híbrida: enviamos q para o server E aplicamos filtro no cliente.
  const params: FamiliesListParams = {
    q: search || undefined,
    page,
    pageSize: limit,
    sortBy: "name",
    sortDir: "asc",
    clientFilter: (f: Family) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [f.name, f.notes]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    },
  };

  const { data, isLoading, isFetching, error, refetch } = useFamilies(params);

  const rows: Family[] = data ? data.items : [];
  const total = data ? data.total : 0;
  const totalPages = data
    ? data.pageCount
    : Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async (f: Family) => {
    if (!confirm(`Eliminar família "${f.name}"?`)) return;
    await api.delete(`/families/${String(f.id)}`);
    await qc.invalidateQueries({ queryKey: ["families"] });
  };

  const header = useMemo(
    () => (
      <div className="toolbar justify-between mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Pesquisar por nome, notas…"
            className="input pl-9"
            aria-label="Pesquisar"
          />
        </div>
        <Link to="/families/create" className="btn-primary">
          <Plus className="size-4" /> Criar
        </Link>
      </div>
    ),
    [searchRaw]
  );

  const statusText = useMemo(() => {
    if (isLoading) return "A carregar…";
    if (error) return "Ocorreu um erro ao carregar.";
    if (rows.length === 0) return "Sem resultados";
    return undefined;
  }, [isLoading, error, rows.length]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Famílias</h1>
      {header}

      <div className="table-wrap">
        <div className="scroll relative">
          <table className="data">
            <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
              <tr>
                <th className="th w-[18rem]">Nome</th>
                <th className="th w-[20rem] hidden md:table-cell">Notas</th>
                <th className="th w-[9rem]">Criado</th>
                <th className="th w-[9rem]">Atualizado</th>
                <th className="th w-[7.5rem] sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-20">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {statusText ? (
                <tr>
                  <td
                    className="td py-10 text-center text-slate-500"
                    colSpan={5}
                  >
                    {statusText}{" "}
                    {isFetching && !isLoading ? " (a atualizar…)" : null}
                    {error ? (
                      <div className="mt-2">
                        <button className="btn" onClick={() => refetch()}>
                          Tentar novamente
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ) : (
                rows.map((f) => (
                  <tr key={String(f.id)} className="row hover:bg-emerald-50">
                    <td className="td">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-semibold shrink-0">
                          {initials(f.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{f.name}</div>
                          <div className="truncate text-xs text-slate-500 md:hidden">
                            Criado: {fmtDate(f.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="td hidden md:table-cell">
                      <div className="truncate">
                        {f.notes && f.notes.trim() ? f.notes : "—"}
                      </div>
                    </td>
                    <td className="td">{fmtDate(f.createdAt)}</td>
                    <td className="td">{fmtDate(f.updatedAt)}</td>
                    <td className="td sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-10">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          className="btn"
                          onClick={() =>
                            navigate(`/families/${String(f.id)}/edit`)
                          }
                          title="Editar"
                        >
                          <PencilLine className="size-4" />
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(f)}
                          title="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-sm text-slate-500">Total: {total}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn disabled:opacity-50"
            >
              Seguinte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
