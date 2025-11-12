import { useState, useMemo } from "react";
import { useReportStockMoves } from "@/hooks/useReports";

function fmtDateTime(d: string) {
  const dt = new Date(d);
  return Number.isNaN(+dt) ? d : dt.toLocaleString("pt-PT");
}

export default function ReportStockMovesPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const q = useReportStockMoves({
    from: from || undefined,
    to: to || undefined,
  });

  const rows = useMemo(() => q.data ?? [], [q.data]);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">
          Movimentos de Stock
        </h1>

        <div className="card mb-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-sm text-slate-600 mb-1">De</label>
              <input
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-slate-600 mb-1">Até</label>
              <input
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4 w-20">Tipo</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4 w-24 text-right">Qtd</th>
                  <th className="py-3 px-4">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.date + r.itemId + String(r.lotId ?? "")}
                    className="border-b border-slate-200 last:border-0 hover:bg-emerald-50"
                  >
                    <td className="py-2 px-4">{fmtDateTime(r.date)}</td>
                    <td className="py-2 px-4">{r.type}</td>
                    <td className="py-2 px-4">{r.itemName}</td>
                    <td className="py-2 px-4">{r.lotId ?? "—"}</td>
                    <td className="py-2 px-4 text-right">{r.quantity}</td>
                    <td className="py-2 px-4">{r.reason ?? "—"}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="py-4 px-4 text-slate-500" colSpan={6}>
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
