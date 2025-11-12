import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDeliveries } from "@/hooks/useDeliveries";
import type { DeliveryStatus } from "@/adapters/deliveries";

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(+dt) ? d : dt.toLocaleDateString("pt-PT");
}

export default function DeliveriesListPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // filtros
  const [status, setStatus] = useState<DeliveryStatus | "" | undefined>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const q = useDeliveries({
    page,
    pageSize,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const rows = useMemo(() => q.data?.items ?? [], [q.data?.items]);

  return (
    <div className="px-6 py-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Entregas</h1>
        <Link to="/deliveries/create" className="btn">
          Nova entrega
        </Link>
      </div>

      {/* Filtros centrados com o mesmo acabamento das doações */}
      <div className="card card-elevated p-4 rounded-2xl shadow-md mb-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col">
            <label className="text-sm mb-1">Estado</label>
            <select
              className="input"
              value={status ?? ""}
              onChange={(e) => {
                setStatus(e.currentTarget.value as DeliveryStatus | "");
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
            <label className="text-sm mb-1">Data de (criado)</label>
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
            <label className="text-sm mb-1">Data até (criado)</label>
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

      {/* Tabela */}
      <div className="card card-elevated p-0 rounded-2xl shadow-md">
        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="py-2 w-28">ID</th>
                <th className="py-2">Beneficiário</th>
                <th className="py-2 w-40">Estado</th>
                <th className="py-2 w-40">Entregue em</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-emerald-50">
                  <td className="py-1 pr-2">
                    <Link className="underline" to={`/deliveries/${d.id}`}>
                      {d.id}
                    </Link>
                  </td>
                  <td className="py-1 pr-2">
                    {d.beneficiaryName ?? d.beneficiaryId}
                  </td>
                  <td className="py-1 pr-2">
                    {d.status === "DELIVERED"
                      ? "Entregue"
                      : d.status === "FAILED"
                      ? "Falhou"
                      : "Por entregar"}
                  </td>
                  <td className="py-1 pr-2">{fmtDate(d.deliveredAt)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="py-3 text-sm text-gray-500" colSpan={4}>
                    Sem resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* paginação simples */}
        <div className="flex items-center justify-end gap-4 text-sm p-3">
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={(q.data?.items?.length ?? 0) < pageSize}
          >
            Seguinte
          </button>
        </div>
      </div>
    </div>
  );
}
