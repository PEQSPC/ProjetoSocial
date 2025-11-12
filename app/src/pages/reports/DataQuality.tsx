import { useReportDataQuality } from "@/hooks/useReports";

export default function ReportDataQualityPage() {
  const q = useReportDataQuality();
  const r = q.data;

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">
          Qualidade de Dados
        </h1>

        {!r ? (
          <div className="card p-4 text-slate-500">A carregar…</div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <Kpi label="Items sem nome" value={r.itemsWithoutName} />
              <Kpi
                label="Items sem stockCurrent"
                value={r.itemsWithoutStockCurrent}
              />
              <Kpi label="Lotes sem validade" value={r.lotsWithoutExpiryFood} />
              <Kpi
                label="Lotes com restante negativo"
                value={r.lotsWithNegativeRemaining}
              />
              <Kpi
                label="Entregas sem linhas"
                value={r.deliveriesWithoutLines}
              />
            </div>

            <div className="card p-4">
              <div className="text-sm text-slate-600">
                Dica: corrige primeiro os KPIs com maior impacto (ex.: lotes sem
                validade nos alimentos e divergências de stock).
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
