// src/pages/schedules/Create.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCreateSchedule } from "@/hooks/useSchedules";
import type { ScheduleType } from "@/adapters/schedules";

export default function ScheduleCreatePage() {
  const nav = useNavigate();
  const createMut = useCreateSchedule();

  const [type, setType] = useState<ScheduleType>("DELIVERY");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");

  const [donorId, setDonorId] = useState("");
  const [donorName, setDonorName] = useState("");

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [assignee, setAssignee] = useState("");
  const [assigneeName, setAssigneeName] = useState("");

  const canSave =
    Boolean(date) &&
    (type === "DELIVERY"
      ? Boolean(beneficiaryId || beneficiaryName)
      : Boolean(donorId || donorName));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    const payload = {
      type,
      status: "PLANNED" as const,
      date,
      timeSlot: timeSlot || null,
      beneficiaryId: type === "DELIVERY" ? beneficiaryId || null : null,
      beneficiaryName: type === "DELIVERY" ? beneficiaryName || null : null,
      donorId: type === "PICKUP" ? donorId || null : null,
      donorName: type === "PICKUP" ? donorName || null : null,
      address: address || null,
      notes: notes || null,
      assignee: assignee || null,
      assigneeName: assigneeName || null,
      deliveryId: null,
      donationId: null,
    };

    const created = await createMut.mutateAsync(payload);
    nav(`/schedules/${created.id}`);
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Novo Agendamento
          </h1>
          <Link to="/schedules" className="btn-secondary">
            Voltar
          </Link>
        </div>

        <form className="card p-6 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Tipo *</label>
              <select
                className="input w-full"
                value={type}
                onChange={(e) => setType(e.target.value as ScheduleType)}
              >
                <option value="DELIVERY">Entrega</option>
                <option value="PICKUP">Recolha</option>
              </select>
            </div>
            <div>
              <label className="label">Data *</label>
              <input
                className="input w-full"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Janela horária</label>
              <input
                className="input w-full"
                placeholder="ex.: 09:00-12:00"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Morada</label>
              <input
                className="input w-full"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {type === "DELIVERY" ? (
              <>
                <div>
                  <label className="label">Beneficiário (ID)</label>
                  <input
                    className="input w-full"
                    value={beneficiaryId}
                    onChange={(e) => setBeneficiaryId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Beneficiário (Nome)</label>
                  <input
                    className="input w-full"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">Doador (ID)</label>
                  <input
                    className="input w-full"
                    value={donorId}
                    onChange={(e) => setDonorId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Doador (Nome)</label>
                  <input
                    className="input w-full"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="label">Atribuído a (ID)</label>
              <input
                className="input w-full"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Atribuído a (Nome)</label>
              <input
                className="input w-full"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Notas</label>
              <textarea
                className="input w-full"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn"
              type="submit"
              disabled={!canSave || createMut.isPending}
            >
              {createMut.isPending ? "A criar…" : "Criar"}
            </button>
            <Link className="btn-secondary" to="/schedules">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
