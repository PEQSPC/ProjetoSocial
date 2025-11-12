// src/pages/reports/SchedulesCompliance.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import ExportButtons from "@/components/ExportButtons"; // <- default import
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Schedule = {
  id: string;
  type: "DELIVERY" | "PICKUP";
  status: "PLANNED" | "CONFIRMED" | "DONE" | "CANCELLED";
  date: string; // YYYY-MM-DD
};

type Row = {
  period: string; // YYYY-MM
  planned: number;
  confirmed: number;
  done: number;
  cancelled: number;
  doneRate: number; // 0..1
};

function ym(d: string): string {
  if (!d || d.length < 7) return d;
  return d.slice(0, 7);
}

export default function SchedulesCompliance() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<Schedule[]>("/schedules", {
          params: { _limit: 10000 },
        });
        const arr: Schedule[] = Array.isArray(res.data) ? res.data : [];
        const map = new Map<string, Row>();

        for (const s of arr) {
          const key = ym(s.date ?? "");
          const r = map.get(key) ?? {
            period: key,
            planned: 0,
            confirmed: 0,
            done: 0,
            cancelled: 0,
            doneRate: 0,
          };
          if (s.status === "PLANNED") r.planned += 1;
          else if (s.status === "CONFIRMED") r.confirmed += 1;
          else if (s.status === "DONE") r.done += 1;
          else if (s.status === "CANCELLED") r.cancelled += 1;
          map.set(key, r);
        }

        const out = Array.from(map.values())
          .map((r) => ({
            ...r,
            doneRate: r.done / Math.max(1, r.planned + r.confirmed + r.done),
          }))
          .sort((a, b) => a.period.localeCompare(b.period));

        setRows(out);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportRows = useMemo(
    () =>
      rows.map((r) => ({
        period: r.period,
        planned: r.planned,
        confirmed: r.confirmed,
        done: r.done,
        cancelled: r.cancelled,
        doneRatePct: Math.round(r.doneRate * 100),
      })),
    [rows]
  );

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Cumprimento de Agendamentos
          </h1>
          <ExportButtons rows={exportRows} filename="schedules_compliance" />
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2">Evolução por mês</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows}>
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="planned" />
                <Line type="monotone" dataKey="confirmed" />
                <Line type="monotone" dataKey="done" />
                <Line type="monotone" dataKey="cancelled" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2">Tabela</h2>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-2 px-3">Período</th>
                  <th className="py-2 px-3">Planeado</th>
                  <th className="py-2 px-3">Confirmado</th>
                  <th className="py-2 px-3">Concluído</th>
                  <th className="py-2 px-3">Cancelado</th>
                  <th className="py-2 px-3">Taxa concluído</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.period}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="py-2 px-3">{r.period}</td>
                    <td className="py-2 px-3">{r.planned}</td>
                    <td className="py-2 px-3">{r.confirmed}</td>
                    <td className="py-2 px-3">{r.done}</td>
                    <td className="py-2 px-3">{r.cancelled}</td>
                    <td className="py-2 px-3">
                      {Math.round(r.doneRate * 100)}%
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      className="py-3 px-3 text-sm text-slate-500"
                      colSpan={6}
                    >
                      {loading ? "A carregar…" : "Sem dados."}
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
