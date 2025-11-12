import { Link, useParams } from "react-router-dom";
import {
  useScheduleDetail,
  useConfirmSchedule,
  useMarkDoneSchedule,
  useCancelSchedule,
} from "@/hooks/useSchedules";

export default function ScheduleDetailPage() {
  const { id = "" } = useParams();

  const q = useScheduleDetail(id);
  const confirmMut = useConfirmSchedule();
  const doneMut = useMarkDoneSchedule();
  const cancelMut = useCancelSchedule();

  const s = q.data;

  const canConfirm = Boolean(s && s.status === "PLANNED");
  const canDone = Boolean(s && s.status === "CONFIRMED");
  const canCancel = Boolean(
    s && (s.status === "PLANNED" || s.status === "CONFIRMED")
  );

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Agendamento {id}
          </h1>
          <Link to="/schedules" className="btn-secondary">
            Voltar
          </Link>
        </div>

        <div className="card p-6">
          {!s ? (
            <div className="text-sm text-slate-500">A carregar…</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <Info
                label="Tipo"
                value={s.type === "DELIVERY" ? "Entrega" : "Recolha"}
              />
              <Info label="Estado" value={s.status} />
              <Info label="Data" value={s.date} />
              <Info label="Janela" value={s.timeSlot ?? "—"} />
              {s.type === "DELIVERY" ? (
                <Info
                  label="Beneficiário"
                  value={s.beneficiaryName ?? s.beneficiaryId ?? "—"}
                />
              ) : (
                <Info label="Doador" value={s.donorName ?? s.donorId ?? "—"} />
              )}
              <Info label="Morada" value={s.address ?? "—"} />
              <Info label="Notas" value={s.notes ?? "—"} />
              <Info
                label="Atribuído a"
                value={s.assigneeName ?? s.assignee ?? "—"}
              />
              <Info
                label="Ligação"
                value={
                  s.type === "DELIVERY" ? (
                    s.deliveryId ? (
                      <Link
                        className="underline"
                        to={`/deliveries/${s.deliveryId}`}
                      >
                        {s.deliveryId}
                      </Link>
                    ) : (
                      "—"
                    )
                  ) : s.donationId ? (
                    <Link
                      className="underline"
                      to={`/donations/${s.donationId}`}
                    >
                      {s.donationId}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          )}
        </div>

        {s && (
          <div className="card p-4 flex flex-wrap items-center gap-2 justify-end">
            {s.type === "DELIVERY" && !s.deliveryId && (
              <Link
                className="btn"
                to={`/deliveries/create?scheduleId=${s.id}`}
              >
                Criar Entrega
              </Link>
            )}
            {s.type === "PICKUP" && !s.donationId && (
              <Link className="btn" to={`/donations/create?scheduleId=${s.id}`}>
                Criar Doação
              </Link>
            )}
            <button
              className="btn-secondary"
              disabled={!canConfirm || confirmMut.isPending}
              onClick={() => confirmMut.mutate(s.id)}
            >
              {confirmMut.isPending ? "A confirmar…" : "Confirmar"}
            </button>
            <button
              className="btn-secondary"
              disabled={!canDone || doneMut.isPending}
              onClick={() => doneMut.mutate(s.id)}
            >
              {doneMut.isPending ? "A concluir…" : "Marcar como concluído"}
            </button>
            <button
              className="btn-secondary"
              disabled={!canCancel || cancelMut.isPending}
              onClick={() => cancelMut.mutate(s.id)}
            >
              {cancelMut.isPending ? "A cancelar…" : "Cancelar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
