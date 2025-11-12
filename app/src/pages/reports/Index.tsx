// src/pages/reports/Index.tsx
import { Link } from "react-router-dom";

export default function ReportsIndex() {
  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h2 className="font-semibold mb-1">Visão Geral de Stock</h2>
            <p className="text-sm text-slate-600 mb-3">
              Stock total por família, artigos abaixo do mínimo e lotes a
              expirar.
            </p>
            <Link className="btn" to="/reports/stock">
              Abrir
            </Link>
          </div>

          <div className="card p-4">
            <h2 className="font-semibold mb-1">Cumprimento de Agendamentos</h2>
            <p className="text-sm text-slate-600 mb-3">
              Taxas de concluído vs cancelado por período.
            </p>
            <Link className="btn" to="/reports/schedules">
              Abrir
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
