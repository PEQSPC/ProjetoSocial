import { useEffect, useMemo, useState } from "react";
import type { Id } from "@/lib/queryKeys";
import { useStockLots } from "@/hooks/useStockLots";
import { useCreateStockLot } from "@/hooks/useCreateStockLot";
import { useUpdateStockLot } from "@/hooks/useUpdateStockLot";
import { useDeleteStockLot } from "@/hooks/useDeleteStockLot";
import { useDonors } from "@/hooks/useDonors";
import type { StockLot } from "@/domain/schemas";
import { PencilLine, Trash2, Plus, MinusCircle } from "lucide-react";

/* ---------- helpers ---------- */
function fmtDate(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(+dt) ? d : dt.toLocaleDateString("pt-PT");
}
function daysUntil(date?: string): number | undefined {
  if (!date) return undefined;
  const target = new Date(date);
  if (isNaN(+target)) return undefined;
  const today = new Date();
  const t0 = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const t1 = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  ).getTime();
  return Math.round((t1 - t0) / (1000 * 60 * 60 * 24));
}
function rowTone(entry?: string, expiry?: string) {
  if (!expiry) return "";
  const d = daysUntil(expiry);
  if (d === undefined) return "";
  if (entry && new Date(expiry) < new Date(entry)) return "bg-red-50";
  if (d < 0) return "bg-red-50";
  if (d <= 30) return "bg-amber-50";
  return "";
}

/* ---------- types ---------- */
type LotForm = {
  lot: string;
  quantity: number;
  remainingQty: number;
  entryDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  donorId?: string;
};

const EMPTY: LotForm = {
  lot: "",
  quantity: 0,
  remainingQty: 0,
  entryDate: "",
  expiryDate: undefined,
  donorId: undefined,
};

export default function ItemLots({ itemId }: { itemId: Id }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Lotes
  const { data, isLoading, refetch } = useStockLots({
    itemId,
    page,
    pageSize,
    sortBy: "expiryDate",
    sortDir: "asc",
  });

  // Doadores (mapear id -> nome)
  const donors = useDonors({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });
  const donorMap = useMemo(() => {
    const m = new Map<string | number, string>();
    (donors.data?.items ?? []).forEach((d) => m.set(d.id, d.name));
    return m;
  }, [donors.data?.items]);

  // Modais/estado
  const [mode, setMode] = useState<"none" | "create" | "edit" | "consume">(
    "none"
  );
  const [editId, setEditId] = useState<Id | null>(null);
  const [form, setForm] = useState<LotForm>({ ...EMPTY });
  const [consumeQty, setConsumeQty] = useState<number>(0);

  const { mutate: createLot, isPending: creating } = useCreateStockLot();
  const { mutate: updateLot, isPending: updating } = useUpdateStockLot();
  const { mutate: deleteLot } = useDeleteStockLot();

  useEffect(() => setPage(1), [itemId]);

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pageCount ?? 1;

  function openCreate() {
    setForm({
      ...EMPTY,
      entryDate: new Date().toISOString().slice(0, 10),
      quantity: 0,
      remainingQty: 0,
    });
    setMode("create");
    setEditId(null);
  }

  function openEdit(l: StockLot) {
    setForm({
      lot: l.lot,
      quantity: l.quantity,
      remainingQty: l.remainingQty,
      entryDate: l.entryDate,
      expiryDate: l.expiryDate,
      donorId: l.donorId ? String(l.donorId) : undefined,
    });
    setMode("edit");
    setEditId(l.id);
  }

  function openConsume(l: StockLot) {
    // Bloquear consumo se vencido
    const d = daysUntil(l.expiryDate);
    if (d !== undefined && d < 0) {
      alert(
        "Não é possível dar baixa num lote vencido. Seleciona um lote válido."
      );
      return;
    }
    setEditId(l.id);
    setConsumeQty(0);
    setMode("consume");
  }

  function closeModal() {
    setMode("none");
    setEditId(null);
    setConsumeQty(0);
  }

  /* ---------- validação do modal ---------- */
  const modalDays = daysUntil(form.expiryDate);
  const modalInvalidDate = !!(
    form.expiryDate && new Date(form.expiryDate) < new Date(form.entryDate)
  );
  const modalInvalidQty =
    form.quantity < 0 ||
    form.remainingQty < 0 ||
    form.remainingQty > form.quantity;
  const modalCanSave =
    !!form.lot &&
    !!form.entryDate &&
    !modalInvalidDate &&
    !modalInvalidQty &&
    !(creating || updating);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modalCanSave) return;

    if (mode === "create") {
      createLot(
        {
          input: {
            itemId,
            lot: form.lot,
            quantity: Number(form.quantity) || 0,
            remainingQty: Number(form.remainingQty) || 0,
            entryDate: form.entryDate,
            expiryDate: form.expiryDate || undefined,
            donorId:
              form.donorId && form.donorId !== "" ? form.donorId : undefined,
          },
        },
        {
          onSuccess: () => {
            closeModal();
            refetch();
            alert("Entrada de stock criada.");
          },
          onError: () => alert("Não foi possível criar a entrada de stock."),
        }
      );
    } else if (mode === "edit" && editId != null) {
      updateLot(
        {
          id: editId,
          itemId,
          patch: {
            lot: form.lot,
            quantity: Number(form.quantity) || 0,
            remainingQty: Number(form.remainingQty) || 0,
            entryDate: form.entryDate,
            expiryDate: form.expiryDate || undefined,
            donorId:
              form.donorId && form.donorId !== "" ? form.donorId : undefined,
          },
        },
        {
          onSuccess: () => {
            closeModal();
            refetch();
            alert("Entrada de stock atualizada.");
          },
          onError: () =>
            alert("Não foi possível atualizar a entrada de stock."),
        }
      );
    }
  }

  function onConsumeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId == null) return;

    const lot = rows.find((r) => String(r.id) === String(editId));
    if (!lot) return;

    // Proteção extra (se o dia virou com modal aberto)
    const d = daysUntil(lot.expiryDate);
    if (d !== undefined && d < 0) {
      alert("Não é possível dar baixa num lote vencido.");
      return;
    }

    const qty = Number(consumeQty) || 0;
    if (qty <= 0) {
      alert("Indique uma quantidade positiva.");
      return;
    }
    if (qty > lot.remainingQty) {
      alert(
        `A quantidade informada (${qty}) excede o saldo do lote (${lot.remainingQty}).`
      );
      return;
    }

    updateLot(
      { id: editId, itemId, patch: { remainingQty: lot.remainingQty - qty } },
      {
        onSuccess: () => {
          closeModal();
          refetch();
          alert("Baixa de stock registada.");
        },
        onError: () => alert("Não foi possível registar a baixa."),
      }
    );
  }

  function onDelete(l: StockLot) {
    if (!confirm(`Eliminar lote "${l.lot}"?`)) return;
    deleteLot(
      { id: l.id, itemId },
      {
        onSuccess: () => {
          refetch();
          alert("Entrada de stock removida.");
        },
        onError: () => alert("Não foi possível remover a entrada de stock."),
      }
    );
  }

  function toneForRow(l: StockLot): string {
    return rowTone(l.entryDate, l.expiryDate);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lotes (Validade)</h2>
        <button className="btn-primary" onClick={openCreate}>
          <Plus className="size-4" /> Nova entrada de stock
        </button>
      </div>

      <div className="table-wrap">
        <div className="scroll relative">
          <table className="data">
            <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
              <tr>
                <th className="th w-[12rem]">Lote</th>
                <th className="th w-[9rem]">Entrada</th>
                <th className="th w-[9rem]">Validade</th>
                <th className="th w-[8rem]">Qtd</th>
                <th className="th w-[8rem]">Saldo</th>
                <th className="th w-[14rem] hidden md:table-cell">Doador</th>
                <th className="th w-[11rem] sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-20">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    className="td py-10 text-center text-slate-500"
                    colSpan={7}
                  >
                    A carregar…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    className="td py-14 text-center text-slate-500"
                    colSpan={7}
                  >
                    Sem entradas de stock
                  </td>
                </tr>
              ) : (
                rows.map((l) => {
                  const tone = toneForRow(l);
                  const d = daysUntil(l.expiryDate);
                  const badge = l.expiryDate ? (
                    d !== undefined && d < 0 ? (
                      <span className="badge bg-red-100 text-red-700">
                        Vencido
                      </span>
                    ) : d !== undefined && d <= 30 ? (
                      <span className="badge bg-amber-100 text-amber-700">
                        {d} dias
                      </span>
                    ) : null
                  ) : null;

                  return (
                    <tr
                      key={String(l.id)}
                      className={`row hover:bg-emerald-50 ${tone}`}
                    >
                      <td className="td font-medium">
                        <div className="flex items-center gap-2">
                          <span>{l.lot}</span>
                          {badge}
                        </div>
                      </td>
                      <td className="td">{fmtDate(l.entryDate)}</td>
                      <td className="td">{fmtDate(l.expiryDate)}</td>
                      <td className="td">{l.quantity}</td>
                      <td className="td">{l.remainingQty}</td>
                      <td className="td hidden md:table-cell">
                        {l.donorId
                          ? donorMap.get(l.donorId) ?? `#${l.donorId}`
                          : "—"}
                      </td>
                      <td className="td sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-10">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            className="btn"
                            title="Baixa de stock"
                            onClick={() => openConsume(l)}
                          >
                            <MinusCircle className="size-4" />
                          </button>
                          <button
                            className="btn"
                            title="Editar"
                            onClick={() => openEdit(l)}
                          >
                            <PencilLine className="size-4" />
                          </button>
                          <button
                            className="btn-danger"
                            title="Eliminar"
                            onClick={() => onDelete(l)}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-sm text-slate-500">Total: {total}</span>
          <div className="flex items-center gap-2">
            <button
              className="btn disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <button
              className="btn disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Seguinte
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Criar/Editar */}
      {mode !== "none" && (mode === "create" || mode === "edit") && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative card p-6 w-full max-w-2xl space-y-4">
            <h3 className="text-lg font-semibold">
              {mode === "create"
                ? "Nova entrada de stock"
                : "Editar entrada de stock"}
            </h3>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Lote *</label>
                  <input
                    className="input"
                    value={form.lot}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lot: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="label">Doador (opcional)</label>
                  <select
                    className="input"
                    value={form.donorId ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        donorId: e.target.value || undefined,
                      }))
                    }
                  >
                    <option value="">— sem doador —</option>
                    {(donors.data?.items ?? []).map((d) => (
                      <option key={String(d.id)} value={String(d.id)}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Data de entrada *</label>
                  <input
                    type="date"
                    className="input"
                    value={form.entryDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, entryDate: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Validade</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className={`input ${
                        modalInvalidDate ? "border-red-400" : ""
                      }`}
                      value={form.expiryDate ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          expiryDate: e.target.value || undefined,
                        }))
                      }
                    />
                    {/* Badge dinâmico */}
                    {form.expiryDate &&
                      (modalDays !== undefined && modalDays < 0 ? (
                        <span className="badge bg-red-100 text-red-700">
                          Vencido
                        </span>
                      ) : modalDays !== undefined && modalDays <= 30 ? (
                        <span className="badge bg-amber-100 text-amber-700">
                          {modalDays} dias
                        </span>
                      ) : null)}
                  </div>
                  {modalInvalidDate && (
                    <p className="text-xs text-red-600 mt-1">
                      A validade não pode ser anterior à data de entrada.
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Quantidade *</label>
                  <input
                    type="number"
                    min={0}
                    className={`input ${
                      modalInvalidQty ? "border-red-400" : ""
                    }`}
                    value={form.quantity}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      setForm((f) => {
                        const next = { ...f, quantity: q };
                        // se remaining coincide com quantity, sincroniza
                        if (
                          f.remainingQty === f.quantity ||
                          f.remainingQty === 0
                        ) {
                          next.remainingQty = Math.max(0, q);
                        }
                        return next;
                      });
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="label">Saldo do lote *</label>
                  <input
                    type="number"
                    min={0}
                    className={`input ${
                      modalInvalidQty ? "border-red-400" : ""
                    }`}
                    value={form.remainingQty}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        remainingQty: Number(e.target.value),
                      }))
                    }
                    required
                  />
                  {modalInvalidQty && (
                    <p className="text-xs text-red-600 mt-1">
                      Saldo ≤ Quantidade e ambos sem negativos.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="btn-primary disabled:opacity-50"
                  disabled={!modalCanSave}
                >
                  {creating || updating ? "A guardar…" : "Guardar"}
                </button>
                <button type="button" className="btn" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Baixa de stock */}
      {mode === "consume" && editId != null && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative card p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Baixa de stock</h3>
            <form className="space-y-4" onSubmit={onConsumeSubmit}>
              <div>
                <label className="label">Quantidade a dar baixa *</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={consumeQty}
                  onChange={(e) => setConsumeQty(Number(e.target.value))}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Não pode exceder o saldo do lote.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" className="btn-primary">
                  Registar
                </button>
                <button type="button" className="btn" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
