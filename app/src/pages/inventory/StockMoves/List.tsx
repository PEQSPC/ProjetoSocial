// src/pages/inventory/StockCounts/List.tsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStockCounts } from "@/hooks/useStockCounts";
import type { StockCountStatus } from "@/domain/schemas";

type StatusFilter = "" | StockCountStatus;

export default function StockCountsList() {
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useStockCounts({
    page,
    pageSize,
    sortBy: "createdAt",
    sortDir: "desc",
    ...(status ? { status } : {}),
  });

  useEffect(() => {
    setPage(1);
  }, [status]);

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.pageCount ?? 1);

  return (
    <div className="space-y-4">
      {/* Header com botão */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Contagens de Stock
        </h1>
        <div className="flex items-center gap-2">
          <Link to="/inventory/moves" className="btn">
            Ver movimentos
          </Link>
          <Link to="/inventory/counts/create" className="btn-primary">
            Nova contagem
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="toolbar">
        <select
          className="input w-[14rem]"
          value={status}
          onChange={(e) => {
            const v = e.target.value;
            const parsed: StatusFilter =
              v === "OPEN" ? "OPEN" : v === "CLOSED" ? "CLOSED" : "";
            setStatus(parsed);
          }}
        >
          <option value="">Todos os estados</option>
          <option value="OPEN">Abertas</option>
          <option value="CLOSED">Fechadas</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="table-wrap">
        <div className="scroll">
          <table className="data">
            <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
              <tr>
                <th className="th w-[18rem]">Nome</th>
                <th className="th w-[8rem]">Estado</th>
                <th className="th w-[12rem]">Criada</th>
                <th className="th w-[12rem]">Fechada</th>
                <th className="th w-[10rem]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="td py-10 text-center" colSpan={5}>
                    A carregar…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    className="td py-10 text-center text-slate-500"
                    colSpan={5}
                  >
                    Sem contagens
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={String(c.id)} className="row hover:bg-emerald-50">
                    <td className="td">{c.name}</td>
                    <td className="td">
                      <span
                        className={`badge ${
                          c.status === "OPEN"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="td">{c.createdAt ?? "—"}</td>
                    <td className="td">{c.closedAt ?? "—"}</td>
                    <td className="td">
                      <Link to={`/inventory/counts/${c.id}`} className="btn">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Paginação */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-sm text-slate-500">Total: {total}</span>
          <div className="flex items-center gap-2">
            <button
              className="btn disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <button
              className="btn disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Seguinte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
