// src/pages/dashboard/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { api } from "@/lib/api";

/* ========================= helpers ========================= */

type Page<T> = { items: T[]; total?: number } | T[];

function getTotal<T>(page: Page<T>) {
  if (Array.isArray(page)) return page.length;
  return page.total ?? page.items.length;
}

function unwrap<T>(page: Page<T>): T[] {
  return Array.isArray(page) ? page : page.items ?? [];
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function labelPtPT(monthIdx: number) {
  // 0..11
  return new Date(2000, monthIdx, 1)
    .toLocaleString("pt-PT", { month: "short" })
    .replace(/\.$/, "")
    .replace(/^./, (s) => s.toUpperCase());
}

const today = new Date();
const from6MonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

/**
 * Faz um GET paginado e junta tudo.
 */
async function fetchAll<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  pageSize = 1000
): Promise<T[]> {
  const first = await api.get<Page<T>>(path, {
    params: { page: 1, pageSize, ...params },
  });
  const total = getTotal(first.data);
  const firstItems = unwrap<T>(first.data);

  if (total <= firstItems.length) return firstItems;

  const pages = Math.ceil(total / pageSize);
  const restPromises: Array<Promise<T[]>> = [];
  for (let p = 2; p <= pages; p++) {
    restPromises.push(
      api
        .get<Page<T>>(path, { params: { page: p, pageSize, ...params } })
        .then((r) => unwrap<T>(r.data))
    );
  }
  const rest = await Promise.all(restPromises);
  return firstItems.concat(...rest);
}

/* ========================= tipos (best-effort) ========================= */

type Beneficiary = { id: string; active?: boolean };
type Donation = { id: string; createdAt?: string | Date };
type Item = {
  id: string;
  name: string;
  category?: string;
  type?: string;
  family?: string;
  stockQty?: number;
  qty?: number;
};
type Schedule = {
  id: string;
  type?: "delivery" | string;
  status?: string;
  date?: string;
};

/* ========================= componente ========================= */

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [beneficiariesCount, setBeneficiariesCount] = useState<number>(0);
  const [donationsThisMonthCount, setDonationsThisMonthCount] =
    useState<number>(0);
  const [donationsMonthly, setDonationsMonthly] = useState<
    { m: string; v: number }[]
  >([]);
  const [stockByType, setStockByType] = useState<
    Array<{ name: string; qty: number }>
  >([]);
  const [scheduledDeliveriesCount, setScheduledDeliveriesCount] =
    useState<number>(0);
  const [deltaDonations, setDeltaDonations] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // === Beneficiários ativos ===
        const benFirst = await api.get<Page<Beneficiary>>("/beneficiaries", {
          params: { active: true, page: 1, pageSize: 1 },
        });
        setBeneficiariesCount(getTotal(benFirst.data));

        // === Doações últimos 6 meses ===
        const donations = await fetchAll<Donation>(
          "/donations",
          {
            createdAt_gte: from6MonthsAgo.toISOString(),
            createdAt_lte: today.toISOString(),
            sortBy: "createdAt",
            sortDir: "asc",
          },
          1000
        );

        const buckets = new Map<string, number>();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          buckets.set(monthKey(d), 0);
        }
        for (const d of donations) {
          const dt = new Date(d.createdAt ?? today);
          const key = monthKey(dt);
          if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }
        const chart = Array.from(buckets.keys())
          .sort() // YYYY-MM
          .map((key) => {
            const parts = key.split("-"); // [YYYY, MM]
            const month = Number(parts[1]); // 1..12
            return { m: labelPtPT(month - 1), v: buckets.get(key) ?? 0 };
          });
        setDonationsMonthly(chart);

        // métricas de mês corrente e delta vs mês anterior
        const donationsThisMonth = donations.filter((d) => {
          const dt = new Date(d.createdAt ?? today);
          return dt >= startOfThisMonth && dt <= today;
        }).length;
        setDonationsThisMonthCount(donationsThisMonth);

        const startOfPrevMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const endOfPrevMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          0
        );
        const donationsPrevMonth = donations.filter((d) => {
          const dt = new Date(d.createdAt ?? today);
          return dt >= startOfPrevMonth && dt <= endOfPrevMonth;
        }).length;
        if (donationsPrevMonth > 0) {
          const pct =
            ((donationsThisMonth - donationsPrevMonth) / donationsPrevMonth) *
            100;
          const sign = pct >= 0 ? "+" : "";
          setDeltaDonations(`${sign}${pct.toFixed(0)}% face ao mês anterior`);
        } else {
          setDeltaDonations(null);
        }

        // === Stock por tipo ===
        const items = await fetchAll<Item>(
          "/items",
          { sortBy: "name", sortDir: "asc" },
          1000
        );
        const agg = new Map<string, number>();
        for (const it of items) {
          const group =
            it.category?.toString() ||
            it.type?.toString() ||
            it.family?.toString() ||
            "Outros";
          const qty =
            (typeof it.stockQty === "number"
              ? it.stockQty
              : typeof it.qty === "number"
              ? it.qty
              : 0) || 0;
          agg.set(group, (agg.get(group) ?? 0) + qty);
        }
        const top = Array.from(agg.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, qty]) => ({ name, qty }));
        setStockByType(top);

        // === Entregas agendadas (futuras) ===
        const schedules = await fetchAll<Schedule>(
          "/schedules",
          {
            type: "delivery",
            status: "scheduled",
            date_gte: new Date().toISOString(),
            sortBy: "date",
            sortDir: "asc",
          },
          1000
        );
        setScheduledDeliveriesCount(schedules.length);
      } catch (e: unknown) {
        // sem 'any'
        const msg = e instanceof Error ? e.message : "Erro ao carregar dados";
        console.error(e);
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kpis = useMemo(() => {
    return [
      {
        label: "Beneficiários ativos",
        value: beneficiariesCount.toLocaleString("pt-PT"),
      },
      {
        label: "Doações (mês)",
        value: donationsThisMonthCount.toLocaleString("pt-PT"),
        delta: deltaDonations ?? undefined,
      },
      {
        label: "Artigos em stock",
        value: stockByType
          .reduce((s, r) => s + (r.qty || 0), 0)
          .toLocaleString("pt-PT"),
      },
      {
        label: "Entregas agendadas",
        value: scheduledDeliveriesCount.toLocaleString("pt-PT"),
      },
    ];
  }, [
    beneficiariesCount,
    donationsThisMonthCount,
    deltaDonations,
    stockByType,
    scheduledDeliveriesCount,
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Resumo rápido da atividade da Loja Social
        </p>
      </header>

      {/* estados globais */}
      {loading && (
        <Card className="p-5">
          <div className="text-sm text-slate-500">A carregar dados…</div>
        </Card>
      )}
      {error && (
        <Card className="p-5">
          <div className="text-sm text-rose-600">Ocorreu um erro: {error}</div>
        </Card>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {k.label}
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">
              {k.value}
            </div>
            {k.delta && (
              <div className="mt-1 text-xs text-[hsl(var(--brand))]">
                {k.delta}
              </div>
            )}
          </Card>
        ))}
      </section>

      {/* Gráficos */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Doações por mês" desc="Últimos 6 meses" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={donationsMonthly}
                  margin={{ left: -10, right: 10, top: 10 }}
                >
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={`hsl(var(--chart-fill))`}
                        stopOpacity={0.5}
                      />
                      <stop
                        offset="95%"
                        stopColor={`hsl(var(--chart-fill))`}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="m"
                    tickMargin={8}
                    tick={{ fill: "var(--chart-tick)", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--chart-tick)", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--card-border)",
                      background: "var(--card-bg)",
                      color: "inherit",
                    }}
                    formatter={(v: number) => [`${v}`, "Doações"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={`var(--chart-line)`}
                    strokeWidth={2}
                    fill="url(#g1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Stock por tipo" desc="Top categorias" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stockByType}
                  margin={{ left: -10, right: 10, top: 10 }}
                >
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickMargin={8}
                    tick={{ fill: "var(--chart-tick)", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--chart-tick)", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--card-border)",
                      background: "var(--card-bg)",
                      color: "inherit",
                    }}
                    formatter={(v: number) => [`${v}`, "Qtd."]}
                  />
                  <Bar
                    dataKey="qty"
                    fill={`hsl(var(--brand))`}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
