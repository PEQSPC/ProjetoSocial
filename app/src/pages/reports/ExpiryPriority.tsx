import { useMemo, useState } from "react";
import { useReportExpiryPriority, type ExpiryBucket } from "@/hooks/useReports";

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(+dt) ? d : dt.toLocaleDateString("pt-PT");
}

export default function ReportExpiryPriorityPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [family, setFamily] = useState("");

  const q = useReportExpiryPriority(
    { from: from || undefined, to: to || undefined },
    family || undefined
  );

  const rows = useMemo(() => q.data?.rows ?? [], [q.data?.rows]);
  const totals = q.data?.totalsByBucket;
  const grand = q.data?.totalQty ?? 0;

  const order: ExpiryBucket[] = ["≤7", "8–15", "16–30", ">30", "Sem validade"];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">
          Prioridade por Validade (FEFO)
        </h1>

        {/* Filtros */}
        <div className="card mb-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex flex-col">
              <label className="text-sm text-slate-600 mb-1">Validade de</label>
              <input
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-slate-600 mb-1">
                Validade até
              </label>
              <input
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-slate-600 mb-1">Família</label>
              <input
                className="input"
                placeholder="ex.: 36de"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-5 gap-3 mb-4">
          {order.map((b) => (
            <div key={b} className="card p-3 text-center">
              <div className="text-xs text-slate-500">{b}</div>
              <div className="text-xl font-semibold">
                {totals ? totals[b] : "—"}
              </div>
            </div>
          ))}
          <div className="card p-3 text-center">
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-xl font-semibold">{grand}</div>
          </div>
        </div>

        {/* Tabela */}
        <div className="card">
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4 w-40">Validade</th>
                  <th className="py-3 px-4 w-32">Dias</th>
                  <th className="py-3 px-4 w-32">Bucket</th>
                  <th className="py-3 px-4 w-32">Disponível</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.lotId}
                    className="border-b border-slate-200 last:border-0 hover:bg-emerald-50"
                  >
                    <td className="py-2 px-4">{r.itemName}</td>
                    <td className="py-2 px-4">{r.lotName}</td>
                    <td className="py-2 px-4">{fmtDate(r.expiryDate)}</td>
                    <td className="py-2 px-4">{r.daysToExpire ?? "—"}</td>
                    <td className="py-2 px-4">{r.bucket}</td>
                    <td className="py-2 px-4">{r.remainingQty}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-slate-500">
                      Sem resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
