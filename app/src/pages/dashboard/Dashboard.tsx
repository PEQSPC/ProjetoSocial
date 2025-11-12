// src/pages/dashboard/Dashboard.tsx
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

const kpis = [
  { label: "Beneficiários ativos", value: "248", delta: "+12 este mês" },
  { label: "Doações (mês)", value: "156", delta: "+8% face ao mês anterior" },
  { label: "Artigos em stock", value: "3 421" },
  { label: "Entregas agendadas", value: "27" },
];

// mock de dados — troca quando ligares à API
const donationsMonthly = [
  { m: "Jan", v: 82 },
  { m: "Fev", v: 95 },
  { m: "Mar", v: 110 },
  { m: "Abr", v: 104 },
  { m: "Mai", v: 126 },
  { m: "Jun", v: 156 },
];

const stockByType = [
  { name: "Casacos", qty: 620 },
  { name: "Calças", qty: 540 },
  { name: "Camisas", qty: 410 },
  { name: "Calçado", qty: 380 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Resumo rápido da atividade da Loja Social
        </p>
      </header>

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
                  <YAxis tick={{ fill: "var(--chart-tick)", fontSize: 12 }} />
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
                  <YAxis tick={{ fill: "var(--chart-tick)", fontSize: 12 }} />
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
