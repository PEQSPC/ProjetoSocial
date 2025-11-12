import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDeliveries } from "@/hooks/useDeliveries";
import type { DeliveryStatus } from "@/adapters/deliveries";

export default function DeliveriesListPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [status, setStatus] = useState<DeliveryStatus | "">("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const q = useDeliveries({
    page,
    pageSize,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const rows = useMemo(() => q.data?.items ?? [], [q.data?.items]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Entregas</h1>
        <Link to="/deliveries/create" className="btn">
          Nova entrega
        </Link>
      </div>

      <div className="card mb-3">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm mb-1">Estado</label>
            <select
              className="input w-full"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as DeliveryStatus | "");
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              <option value="NOT_DELIVERED">Não entregue</option>
              <option value="DELIVERED">Entregue</option>
              <option value="FAILED">Falhou</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Data de</label>
            <input
              type="date"
              className="input w-full"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Data até</label>
            <input
              type="date"
              className="input w-full"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="py-2">ID</th>
              <th className="py-2">Beneficiário</th>
              <th className="py-2">Estado</th>
              <th className="py-2">Entregue em</th>
              <th className="py-2 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="hover:bg-emerald-50">
                <td className="py-1">{d.id}</td>
                <td className="py-1">{d.beneficiaryName ?? d.beneficiaryId}</td>
                <td className="py-1">{d.status}</td>
                <td className="py-1">
                  {d.deliveredAt
                    ? new Date(d.deliveredAt).toLocaleString("pt-PT")
                    : "—"}
                </td>
                <td className="py-1">
                  <Link className="btn-secondary" to={`/deliveries/${d.id}`}>
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-3 text-sm text-gray-500" colSpan={5}>
                  Sem resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3">
        <button
          className="btn-secondary"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </button>
        <span className="text-sm">Página {page}</span>
        <button
          className="btn-secondary"
          disabled={(q.data?.items?.length ?? 0) < pageSize}
          onClick={() => setPage((p) => p + 1)}
        >
          Seguinte
        </button>
      </div>
    </div>
  );
}
