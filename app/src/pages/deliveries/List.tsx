// src/pages/deliveries/List.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDeliveries } from "@/hooks/useDeliveries";
import type { DeliveryStatus } from "@/adapters/deliveries";

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(+dt) ? d : dt.toLocaleDateString("pt-PT");
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const map: Record<DeliveryStatus, { label: string; cls: string }> = {
    NOT_DELIVERED: {
      label: "Por entregar",
      cls: "bg-amber-100 text-amber-800",
    },
    DELIVERED: { label: "Entregue", cls: "bg-emerald-100 text-emerald-800" },
    FAILED: { label: "Falhou", cls: "bg-rose-100 text-rose-800" },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

export default function DeliveriesListPage() {
  // paginação
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // filtros
  const [status, setStatus] = useState<DeliveryStatus | "" | undefined>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [q, setQ] = useState("");

  const qry = useDeliveries({
    page,
    pageSize,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    q: q.trim() || undefined, // opcional: .trim() para evitar espaços vazios
  });

  const rows = useMemo(() => qry.data?.items ?? [], [qry.data?.items]);
  const total = qry.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Entregas</h1>

        {/* Barra de pesquisa + botão (estilo Artigos) */}
        <div className="card mb-5 flex items-center gap-3 p-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar por ID, beneficiário, notas…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <Link to="/deliveries/create" className="btn">
            + Nova entrega
          </Link>
        </div>

        {/* Filtros – largura igual ao resto */}
        <div className="card mb-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-slate-600">Estado</label>
              <select
                className="input"
                value={status ?? ""}
                onChange={(e) => {
                  setStatus((e.target.value || "") as DeliveryStatus | "");
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                <option value="NOT_DELIVERED">Por entregar</option>
                <option value="DELIVERED">Entregue</option>
                <option value="FAILED">Falhou</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-slate-600">
                Data de (criado)
              </label>
              <input
                className="input"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-slate-600">
                Data até (criado)
              </label>
              <input
                className="input"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Tabela (igual estética Artigos) */}
        <div className="card">
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-3 px-4 w-28 text-slate-600">ID</th>
                  <th className="py-3 px-4 text-slate-600">Beneficiário</th>
                  <th className="py-3 px-4 w-40 text-slate-600">Estado</th>
                  <th className="py-3 px-4 w-40 text-slate-600">Entregue em</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-slate-200 last:border-0 hover:bg-emerald-50"
                  >
                    <td className="py-3 px-4">
                      <Link className="underline" to={`/deliveries/${d.id}`}>
                        {d.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      {d.beneficiaryName ?? d.beneficiaryId}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3 px-4">{fmtDate(d.deliveredAt)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="py-4 px-4 text-sm text-gray-500" colSpan={4}>
                      Sem resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-end gap-4 text-sm mt-4 px-4">
            <button
              className="btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || qry.isFetching}
            >
              Anterior
            </button>
            <span className="text-slate-600">
              Página {page} de {pageCount}
            </span>
            <button
              className="btn-secondary"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount || qry.isFetching}
            >
              Seguinte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
