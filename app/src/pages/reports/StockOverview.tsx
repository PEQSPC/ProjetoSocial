// src/pages/reports/StockOverview.tsx
import { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/api";
import ExportButtons from "@/components/ExportButtons";
import Modal from "@/components/Modal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Item = {
  id: string;
  name: string;
  familyId?: string | null;
  stockCurrent?: number | null;
  minStock?: number | null;
};

type Family = { id: string; name: string };

type Lot = {
  id: string;
  itemId: string;
  lot?: string | null;
  expiryDate?: string | null;
  remainingQty?: number | null;
};

type FamilyAgg = {
  familyId: string;
  familyName: string;
  stockTotal: number;
  itemsCount: number;
  belowMinCount: number;
};

type DrillRow = {
  itemId: string;
  itemName: string;
  stockCurrent: number;
  minStock: number;
};

function parseISO(d?: string | null): number {
  if (!d) return Number.MAX_SAFE_INTEGER;
  const t = Date.parse(d);
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

export default function StockOverview() {
  const [items, setItems] = useState<Item[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);

  const [drill, setDrill] = useState<{
    open: boolean;
    familyId?: string;
    title?: string;
  }>({ open: false });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [itRes, famRes] = await Promise.all([
          api.get<Item[]>("/items", { params: { _limit: 5000 } }),
          api.get<Family[]>("/families", { params: { _limit: 5000 } }),
        ]);

        // tentar /stock_lots e, se falhar, /stockLots
        let lotsData: Lot[] = [];
        try {
          const r1 = await api.get<Lot[]>("/stock_lots", {
            params: { _limit: 50000 },
          });
          lotsData = Array.isArray(r1.data) ? r1.data : [];
        } catch {
          try {
            const r2 = await api.get<Lot[]>("/stockLots", {
              params: { _limit: 50000 },
            });
            lotsData = Array.isArray(r2.data) ? r2.data : [];
          } catch {
            lotsData = [];
          }
        }

        setItems(Array.isArray(itRes.data) ? itRes.data : []);
        setFamilies(Array.isArray(famRes.data) ? famRes.data : []);
        setLots(lotsData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const famNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of families) m.set(f.id, f.name);
    return m;
  }, [families]);

  const nearExpiryCounts = useMemo(() => {
    const now = Date.now();
    const THIRTY = 30 * 24 * 60 * 60 * 1000;
    const counts = new Map<string, number>();
    for (const l of lots) {
      const t = parseISO(l.expiryDate);
      if (t - now <= THIRTY) {
        const it = items.find((i) => i.id === l.itemId);
        const fid = String(it?.familyId ?? "—");
        counts.set(fid, (counts.get(fid) ?? 0) + (l.remainingQty ?? 0));
      }
    }
    return counts;
  }, [lots, items]);

  const byFamily: FamilyAgg[] = useMemo(() => {
    const map = new Map<string, FamilyAgg>();
    for (const it of items) {
      const fid = String(it.familyId ?? "—");
      const entry = map.get(fid) ?? {
        familyId: fid,
        familyName: famNameById.get(fid) ?? "Sem família",
        stockTotal: 0,
        itemsCount: 0,
        belowMinCount: 0,
      };
      entry.itemsCount += 1;
      const sc = it.stockCurrent ?? 0;
      const ms = it.minStock ?? 0;
      entry.stockTotal += sc;
      if (ms > 0 && sc < ms) entry.belowMinCount += 1;
      map.set(fid, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.stockTotal - a.stockTotal);
  }, [items, famNameById]);

  const exportRows = useMemo(
    () =>
      byFamily.map((f) => ({
        familyId: f.familyId,
        familyName: f.familyName,
        stockTotal: f.stockTotal,
        itemsCount: f.itemsCount,
        belowMinCount: f.belowMinCount,
        nearExpiryQty: nearExpiryCounts.get(f.familyId) ?? 0,
      })),
    [byFamily, nearExpiryCounts]
  );

  const pieData = useMemo(
    () => byFamily.map((f) => ({ name: f.familyName, value: f.stockTotal })),
    [byFamily]
  );

  const COLORS = [
    "#059669",
    "#10b981",
    "#34d399",
    "#6ee7b7",
    "#a7f3d0",
    "#d1fae5",
  ];

  const drillRows: DrillRow[] = useMemo(() => {
    if (!drill.familyId) return [];
    const nameById = new Map<string, string>();
    for (const it of items) nameById.set(it.id, it.name);
    return items
      .filter((i) => String(i.familyId ?? "—") === drill.familyId)
      .map((i) => ({
        itemId: i.id,
        itemName: nameById.get(i.id) ?? i.id,
        stockCurrent: i.stockCurrent ?? 0,
        minStock: i.minStock ?? 0,
      }))
      .sort((a, b) => b.stockCurrent - a.stockCurrent);
  }, [drill.familyId, items]);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Visão Geral de Stock
          </h1>
          <ExportButtons rows={exportRows} filename="stock_overview" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h2 className="font-semibold mb-2">Stock por família</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byFamily}>
                  <XAxis dataKey="familyName" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="stockTotal"
                    onClick={(d) => {
                      // @ts-expect-error Recharts typing
                      const fid = d?.activePayload?.[0]?.payload?.familyId as
                        | string
                        | undefined;
                      if (fid)
                        setDrill({
                          open: true,
                          familyId: fid,
                          title: "Artigos da família",
                        });
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-500 mt-2">
                Clique numa barra para ver os artigos (drill-down).
              </p>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="font-semibold mb-2">Distribuição (Pie)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={pieData} outerRadius={90} label>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-3">Tabela resumida</h2>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-2 px-3">Família</th>
                  <th className="py-2 px-3">Stock total</th>
                  <th className="py-2 px-3"># Artigos</th>
                  <th className="py-2 px-3">Abaixo do mínimo</th>
                  <th className="py-2 px-3">Qtd a expirar (≤30d)</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {byFamily.map((f) => (
                  <tr
                    key={f.familyId}
                    className="border-b border-slate-200 last:border-0 hover:bg-emerald-50"
                  >
                    <td className="py-2 px-3">{f.familyName}</td>
                    <td className="py-2 px-3">{f.stockTotal}</td>
                    <td className="py-2 px-3">{f.itemsCount}</td>
                    <td className="py-2 px-3">{f.belowMinCount}</td>
                    <td className="py-2 px-3">
                      {nearExpiryCounts.get(f.familyId) ?? 0}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          setDrill({
                            open: true,
                            familyId: f.familyId,
                            title: f.familyName,
                          })
                        }
                      >
                        Ver artigos
                      </button>
                    </td>
                  </tr>
                ))}
                {byFamily.length === 0 && (
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

        <Modal
          open={drill.open}
          onClose={() => setDrill({ open: false })}
          title={drill.title ?? "Artigos"}
        >
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-2 px-3">Artigo</th>
                  <th className="py-2 px-3">Stock</th>
                  <th className="py-2 px-3">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {drillRows.map((r) => (
                  <tr
                    key={r.itemId}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="py-2 px-3">{r.itemName}</td>
                    <td className="py-2 px-3">{r.stockCurrent}</td>
                    <td className="py-2 px-3">{r.minStock}</td>
                  </tr>
                ))}
                {drillRows.length === 0 && (
                  <tr>
                    <td
                      className="py-3 px-3 text-sm text-slate-500"
                      colSpan={3}
                    >
                      Sem artigos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      </div>
    </div>
  );
}
