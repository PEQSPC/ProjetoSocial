import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, PencilLine, Trash2 } from "lucide-react";
import { useBeneficiaries, type Beneficiary } from "@/hooks/useBeneficiaries";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}
function fmtDate(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(+dt) ? d : dt.toLocaleDateString("pt-PT");
}

function YearBadge({ year }: { year?: number }) {
  if (year === undefined || year === null) return null;
  return <span className="badge">{year}º ano</span>;
}

export default function BeneficiariesList() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // pesquisa com debounce
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchRaw), 250);
    return () => clearTimeout(t);
  }, [searchRaw]);

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useBeneficiaries({ search, page, limit });
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async (b: Beneficiary) => {
    if (!confirm(`Eliminar beneficiário ${b.name}?`)) return;
    await api.delete(`/beneficiaries/${b.id}`);
    // refetch limpo (qualquer query da lista)
    qc.invalidateQueries({ queryKey: ["beneficiaries"] });
  };

  const header = useMemo(
    () => (
      <div className="toolbar justify-between mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Pesquisar por nome, email, nº aluno, NIF…"
            className="input pl-9"
          />
        </div>
        <Link to="/beneficiaries/create" className="btn-primary">
          <Plus className="size-4" /> Criar
        </Link>
      </div>
    ),
    [searchRaw]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Beneficiários</h1>
      {header}

      <div className="table-wrap">
        <div className="scroll relative">
          <table className="data">
            <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
              <tr>
                <th className="th w-[6.5rem]">Nº Aluno</th>
                <th className="th w-[18rem]">Nome</th>
                <th className="th w-[8.5rem]">NIF</th>
                <th className="th w-[9rem]">Data Nasc.</th>
                <th className="th w-[16rem] hidden md:table-cell">Email</th>
                <th className="th w-[14rem] hidden lg:table-cell">Curso</th>
                <th className="th w-[9rem] hidden sm:table-cell">Contacto</th>
                <th className="th w-[7.5rem] sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-20">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    className="td py-10 text-center text-slate-500"
                    colSpan={8}
                  >
                    A carregar…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    className="td py-14 text-center text-slate-500"
                    colSpan={8}
                  >
                    Sem resultados
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="row hover:bg-emerald-50">
                    <td className="td font-medium text-slate-700">
                      {b.studentNumber}
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-semibold shrink-0">
                          {initials(b.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{b.name}</div>
                          <div className="truncate text-xs text-slate-500 sm:hidden">
                            {b.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="td">{b.nif ?? "—"}</td>
                    <td className="td">{fmtDate(b.birthDate)}</td>
                    <td className="td hidden md:table-cell">
                      <div className="truncate">{b.email}</div>
                    </td>
                    <td className="td hidden lg:table-cell">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{b.course ?? "—"}</span>
                        <YearBadge year={b.curricularYear} />
                      </div>
                    </td>
                    <td className="td hidden sm:table-cell">
                      {b.phone ?? "—"}
                    </td>
                    <td className="td sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-10">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          className="btn"
                          onClick={() =>
                            navigate(`/beneficiaries/${b.id}/edit`)
                          }
                          title="Editar"
                        >
                          <PencilLine className="size-4" />
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(b)}
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
