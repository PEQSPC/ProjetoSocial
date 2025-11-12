import { useMemo, useState } from "react";
import { useReportDeliveriesByBeneficiary } from "@/hooks/useReports";

export default function ReportDeliveriesByBeneficiaryPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const q = useReportDeliveriesByBeneficiary({
    from: from || undefined,
    to: to || undefined,
  });

  const rows = useMemo(() => q.data ?? [], [q.data]);

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">
          Entregas por Beneficiário
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
                  <th className="py-3 px-4">Beneficiário</th>
                  <th className="py-3 px-4 w-40"># Entregas</th>
                  <th className="py-3 px-4 w-40">Qtd Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.beneficiary}
                    className="border-b border-slate-200 last:border-0 hover:bg-emerald-50"
                  >
                    <td className="py-2 px-4">{r.beneficiary}</td>
                    <td className="py-2 px-4">{r.deliveriesCount}</td>
                    <td className="py-2 px-4">{r.totalQuantity}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="py-4 px-4 text-slate-500" colSpan={3}>
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
