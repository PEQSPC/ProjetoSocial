import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSchedules } from "@/hooks/useSchedules";
import type { ScheduleStatus, ScheduleType } from "@/adapters/schedules";

/* ---------- Badge ---------- */
type BadgeColor = "green" | "amber" | "sky" | "rose" | "slate";

function Badge({
  color,
  children,
}: {
  color: BadgeColor;
  children: React.ReactNode;
}) {
  const map: Record<BadgeColor, string> = {
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    sky: "bg-sky-100 text-sky-800",
    rose: "bg-rose-100 text-rose-800",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[color]}`}
    >
      {children}
    </span>
  );
}

function TypeBadge({ t }: { t: ScheduleType }) {
  return (
    <Badge color={t === "DELIVERY" ? "sky" : "slate"}>
      {t === "DELIVERY" ? "Entrega" : "Recolha"}
    </Badge>
  );
}

function StatusBadge({ s }: { s: ScheduleStatus }) {
  const color: BadgeColor =
    s === "PLANNED"
      ? "amber"
      : s === "CONFIRMED"
      ? "sky"
      : s === "DONE"
      ? "green"
      : "rose";

  const label =
    s === "PLANNED"
      ? "Planeado"
      : s === "CONFIRMED"
      ? "Confirmado"
      : s === "DONE"
      ? "Concluído"
      : "Cancelado";

  return <Badge color={color}>{label}</Badge>;
}

/* ---------- Página ---------- */
export default function SchedulesListPage() {
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [q, setQ] = useState("");
  const [type, setType] = useState<ScheduleType | "" | undefined>("");
  const [status, setStatus] = useState<ScheduleStatus | "" | undefined>("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const qry = useSchedules({
    page,
    pageSize,
    q: q.trim() || undefined,
    type: (type || undefined) as ScheduleType | undefined,
    status: (status || undefined) as ScheduleStatus | undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const rows = useMemo(() => qry.data?.items ?? [], [qry.data?.items]);
  const total = qry.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">
          Agendamentos
        </h1>

        {/* Pesquisa + botão */}
        <div className="card mb-5 flex items-center gap-3 p-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar por beneficiário, doador, morada, notas…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <Link to="/schedules/create" className="btn">
            + Novo
          </Link>
        </div>

        {/* Filtros */}
        <div className="card mb-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-slate-600">Tipo</label>
              <select
                className="input"
                value={type ?? ""}
                onChange={(e) => {
                  setType((e.target.value || "") as ScheduleType | "");
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                <option value="DELIVERY">Entrega</option>
                <option value="PICKUP">Recolha</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-slate-600">Estado</label>
              <select
                className="input"
                value={status ?? ""}
                onChange={(e) => {
                  setStatus((e.target.value || "") as ScheduleStatus | "");
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                <option value="PLANNED">Planeado</option>
                <option value="CONFIRMED">Confirmado</option>
                <option value="DONE">Concluído</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-slate-600">Data de</label>
              <input
                className="input"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1 text-slate-600">Data até</label>
              <input
                className="input"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="card">
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-3 px-4 w-28 text-slate-600">Data</th>
                  <th className="py-3 px-4 w-28 text-slate-600">Janela</th>
                  <th className="py-3 px-4 w-28 text-slate-600">Tipo</th>
                  <th className="py-3 px-4 w-40 text-slate-600">Estado</th>
                  <th className="py-3 px-4 text-slate-600">Entidade</th>
                  <th className="py-3 px-4 text-slate-600">Morada</th>
                  <th className="py-3 px-4 w-40 text-slate-600"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-200 last:border-0 hover:bg-emerald-50"
                  >
                    <td className="py-3 px-4">{s.date}</td>
                    <td className="py-3 px-4">{s.timeSlot ?? "—"}</td>
                    <td className="py-3 px-4">
                      <TypeBadge t={s.type} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge s={s.status} />
                    </td>
                    <td className="py-3 px-4">
                      {s.type === "DELIVERY"
                        ? s.beneficiaryName ?? s.beneficiaryId ?? "—"
                        : s.donorName ?? s.donorId ?? "—"}
                    </td>
                    <td className="py-3 px-4">{s.address ?? "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <Link
                          className="btn-secondary"
                          to={`/schedules/${s.id}`}
                        >
                          Abrir
                        </Link>
                        {s.type === "DELIVERY" && (
                          <Link
                            className="btn"
                            to={`/deliveries/create?scheduleId=${s.id}`}
                          >
                            Criar Entrega
                          </Link>
                        )}
                        {s.type === "PICKUP" && (
                          <Link
                            className="btn"
                            to={`/donations/create?scheduleId=${s.id}`}
                          >
                            Criar Doação
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="py-4 px-4 text-sm text-gray-500" colSpan={7}>
                      Sem resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-end gap-4 text-sm mt-4 px-4">
            <button
              className="btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || qry.isFetching}
            >
              Anterior
            </button>
            <span className="text-slate-600">
              Página {page} de {pageCount}
            </span>
            <button
              className="btn-secondary"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount || qry.isFetching}
            >
              Seguinte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
