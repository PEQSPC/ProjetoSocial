import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBeneficiaries } from "@/hooks/useBeneficiaries";
import { useItems } from "@/hooks/useItems";
import { useCreateDelivery, useConfirmDelivery } from "@/hooks/useDeliveries";
import { api } from "@/lib/api";
import type { DeliveryLine } from "@/adapters/deliveryLines";

/* ===== Tipos locais ===== */
type NamedId = { id: string; name?: string | null };
type ItemLite = { id: string; name?: string | null; ean?: string | null };

type StockLot = {
  id: string;
  itemId: string;
  // vários datasets: preferimos "lot" (nome do lote), depois "name", "code" e por último id
  lot?: string | null;
  name?: string | null;
  code?: string | null;
  expiryDate?: string | null;
  remainingQty: number;
};

type LineForm = {
  id: string;
  itemId: string;
  quantity: number;
  lot?: string | null;
  note?: string | null;
};

/* ===== Helpers ===== */
function newId(): string {
  // cuidamos do suporte a browsers antigos
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
function toArray<T>(src: unknown): T[] {
  return Array.isArray(src) ? (src as T[]) : [];
}
function toNamedIdArray(src: unknown): NamedId[] {
  return toArray<NamedId>(src);
}
function toItemsLite(src: unknown): ItemLite[] {
  return toArray<ItemLite>(src);
}
function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(+dt) ? d : dt.toLocaleDateString("pt-PT");
}
function lotDisplayName(l: StockLot): string {
  return l.lot || l.name || l.code || l.id;
}
function useQueryParam(name: string) {
  const loc = useLocation();
  return useMemo(
    () => new URLSearchParams(loc.search).get(name),
    [loc.search, name]
  );
}

export default function DeliveriesCreatePage() {
  const navigate = useNavigate();
  const scheduleId = useQueryParam("scheduleId") ?? undefined;

  // form state
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState<string | undefined>(
    undefined
  );
  const [notes, setNotes] = useState<string>("");

  const [lines, setLines] = useState<LineForm[]>([
    { id: newId(), itemId: "", quantity: 1, lot: undefined, note: "" },
  ]);

  // EAN + mensagens
  const [ean, setEan] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // cache de lotes por item
  const [lotsByItem, setLotsByItem] = useState<Map<string, StockLot[]>>(
    new Map()
  );

  /* ===== Catálogos ===== */
  const benQ = useBeneficiaries({ search: "", page: 1, limit: 2000 });
  const itemsQ = useItems({
    page: 1,
    pageSize: 2000,
    sortBy: "name",
    sortDir: "asc",
  });

  const beneficiaries: NamedId[] = toNamedIdArray(benQ.data?.data);
  const items: ItemLite[] = toItemsLite(itemsQ.data?.items);

  const itemById = useMemo(() => {
    const m = new Map<string, ItemLite>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  const itemByEAN = useMemo(() => {
    const m = new Map<string, ItemLite>();
    for (const it of items) {
      const key = (it.ean ?? "").trim();
      if (key) m.set(key, it);
    }
    return m;
  }, [items]);

  /* ===== Pré-preenchimento por schedule ===== */
  useEffect(() => {
    if (!scheduleId) return;
    (async () => {
      const res = await api.get(`/schedules/${scheduleId}`);
      const sch = res.data as {
        beneficiaryId?: string;
        beneficiaryName?: string;
        notes?: string;
      };
      if (sch?.beneficiaryId) setBeneficiaryId(sch.beneficiaryId);
      if (sch?.beneficiaryName) setBeneficiaryName(sch.beneficiaryName);
      if (sch?.notes) setNotes(sch.notes);
    })();
  }, [scheduleId]);

  // Resolve nome do beneficiário se não veio denormalizado
  useEffect(() => {
    if (!beneficiaryName && beneficiaryId && beneficiaries.length > 0) {
      const b = beneficiaries.find((x) => x.id === beneficiaryId);
      if (b?.name) setBeneficiaryName(b.name);
    }
  }, [beneficiaryId, beneficiaryName, beneficiaries.length]);

  const createMut = useCreateDelivery();
  const confirmMut = useConfirmDelivery();

  /* ===== Lotes ===== */
  async function ensureLotsLoaded(itemId: string) {
    if (!itemId || lotsByItem.has(itemId)) return;

    let list: StockLot[] = [];
    try {
      const res = await api.get<StockLot[]>("/stockLots", {
        params: { itemId, _sort: "expiryDate", _order: "asc" },
      });
      list = toArray<StockLot>(res.data);
    } catch {
      /* ignore */
    }

    if (list.length === 0) {
      // fallback para nomes alternativos
      try {
        const res2 = await api.get<StockLot[]>("/stock_lots", {
          params: { itemId, _sort: "expiryDate", _order: "asc" },
        });
        list = toArray<StockLot>(res2.data);
      } catch {
        /* ignore */
      }
    }

    list.sort((a, b) => {
      const ax = a.expiryDate
        ? new Date(a.expiryDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bx = b.expiryDate
        ? new Date(b.expiryDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      return ax - bx;
    });

    setLotsByItem((m) => new Map(m).set(itemId, list));
  }

  function lotsFor(itemId: string): StockLot[] {
    return lotsByItem.get(itemId) ?? [];
  }
  function itemHasLots(itemId: string): boolean {
    return lotsFor(itemId).length > 0;
  }

  async function updateLine(id: string, patch: Partial<LineForm>) {
    setMsg(null);
    setLines((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, ...patch, ...(patch.itemId ? { lot: null } : {}) }
          : l
      )
    );
    if (patch.itemId) await ensureLotsLoaded(patch.itemId);
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { id: newId(), itemId: "", quantity: 1, lot: undefined, note: "" },
    ]);
  }
  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  /* ===== EAN ===== */
  async function addByEAN() {
    setMsg(null);
    const code = ean.trim();
    if (!code) return;

    const found = itemByEAN.get(code);
    if (!found) {
      setMsg(`EAN ${code} não corresponde a nenhum artigo.`);
      return;
    }

    await ensureLotsLoaded(found.id);

    setLines((prev) => {
      const idx = prev.findIndex((l) => l.itemId === found.id && !l.lot);
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], quantity: clone[idx].quantity + 1 };
        return clone;
      }
      const existingLots = lotsFor(found.id);
      const autoLot = existingLots.length === 1 ? existingLots[0].id : null;
      return [
        ...prev,
        { id: newId(), itemId: found.id, quantity: 1, lot: autoLot, note: "" },
      ];
    });

    setEan("");
  }

  /* ===== Validação e helpers ===== */
  function resolveItemName(itemId: string): string | null {
    const it = itemById.get(itemId);
    return it?.name ?? null;
  }

  const canSave =
    Boolean(beneficiaryId) &&
    lines.length > 0 &&
    lines.every((l) => {
      if (!l.itemId || l.quantity <= 0) return false;
      if (itemHasLots(l.itemId) && !l.lot) return false;
      return true;
    });

  async function doCreateDraft() {
    const deliveryPayload = {
      beneficiaryId,
      beneficiaryName,
      scheduledId: scheduleId ?? null,
      status: "NOT_DELIVERED" as const,
      deliveredAt: null,
      notes,
    };

    const linesPayload: Array<Omit<DeliveryLine, "id" | "deliveryId">> =
      lines.map((l) => ({
        itemId: l.itemId,
        itemName: resolveItemName(l.itemId),
        quantity: l.quantity,
        lot: l.lot ?? null,
        note: l.note ?? null,
      }));

    return createMut.mutateAsync({
      delivery: deliveryPayload,
      lines: linesPayload,
    });
  }

  async function handleSaveDraft() {
    if (!canSave) {
      setMsg(
        "Preencha os campos obrigatórios. Alguns artigos exigem seleção de Lote."
      );
      return;
    }
    const created = await doCreateDraft();
    navigate(`/deliveries/${created.id}`);
  }

  async function handleConfirm() {
    if (!canSave) {
      setMsg(
        "Preencha os campos obrigatórios. Alguns artigos exigem seleção de Lote."
      );
      return;
    }
    const created = await doCreateDraft();

    const linesRes = await api.get("/delivery_lines", {
      params: { deliveryId: created.id },
    });
    const createdLines = toArray<DeliveryLine>(linesRes.data);

    await confirmMut.mutateAsync({
      delivery: created,
      lines: createdLines,
      scheduleId: scheduleId ?? null,
    });

    navigate(`/deliveries/${created.id}`);
  }

  /* ===== UI ===== */
  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Nova Entrega</h1>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={() => navigate("/deliveries")}
          >
            Cancelar
          </button>
          <button
            className="btn"
            disabled={createMut.isPending}
            onClick={handleSaveDraft}
          >
            Gravar
          </button>
          <button
            className="btn"
            disabled={createMut.isPending}
            onClick={handleConfirm}
          >
            Confirmar entrega
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col">
            <label className="text-sm mb-1">Beneficiário</label>
            <select
              className="input"
              value={beneficiaryId}
              onChange={(e) => setBeneficiaryId(e.target.value)}
            >
              <option value="">— selecionar —</option>
              {beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name ?? b.id}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex flex-col">
            <label className="text-sm mb-1">Notas</label>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações…"
            />
          </div>
        </div>
      </div>

      <div className="card mb-12">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Linhas</h2>
          <button className="btn" onClick={addLine}>
            Adicionar linha
          </button>
        </div>

        {/* Barra EAN */}
        <div className="mt-3 grid gap-3 md:grid-cols-[280px_140px_auto]">
          <div className="flex flex-col">
            <label className="text-sm mb-1">EAN / Código</label>
            <input
              className="input"
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addByEAN();
              }}
              placeholder="Bipe ou escreva o EAN…"
            />
          </div>
          <div className="flex items-end">
            <button className="btn w-full" onClick={addByEAN}>
              Adicionar por EAN
            </button>
          </div>
          {msg && <div className="text-sm text-red-600 self-end">{msg}</div>}
        </div>

        {/* Tabela */}
        <div className="table-wrap mt-4">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="py-2">Artigo</th>
                <th className="py-2 w-24">Qtd</th>
                <th className="py-2 w-[280px]">Lote</th>
                <th className="py-2">Nota</th>
                <th className="py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((ln) => {
                const lots = lotsFor(ln.itemId);
                const requireLot = ln.itemId && lots.length > 0;
                return (
                  <tr key={ln.id} className="hover:bg-emerald-50">
                    <td className="py-1 pr-2">
                      <select
                        className="input w-full"
                        value={ln.itemId}
                        onChange={async (e) => {
                          const itemId = e.target.value;
                          await updateLine(ln.id, { itemId });
                        }}
                      >
                        <option value="">— selecionar —</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name ?? it.id}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        min={1}
                        className="input w-full text-center"
                        value={ln.quantity}
                        onChange={(e) =>
                          updateLine(ln.id, {
                            quantity: Number(e.target.value) || 1,
                          })
                        }
                      />
                    </td>

                    <td className="py-1 pr-2">
                      <div className="flex flex-col">
                        <select
                          className={`input w-full ${
                            requireLot && !ln.lot ? "border-red-400" : ""
                          }`}
                          value={ln.lot ?? ""}
                          onChange={(e) =>
                            updateLine(ln.id, { lot: e.target.value || null })
                          }
                          disabled={!ln.itemId}
                        >
                          <option value="">
                            {requireLot ? "— selecione um lote —" : "Sem lote"}
                          </option>
                          {lots.map((l) => (
                            <option key={l.id} value={l.id}>
                              {lotDisplayName(l)}
                              {l.expiryDate
                                ? ` • exp: ${fmtDate(l.expiryDate)}`
                                : ""}{" "}
                              • disp: {l.remainingQty}
                            </option>
                          ))}
                        </select>
                        {requireLot && !ln.lot && (
                          <span className="text-xs text-red-600 mt-1">
                            Este artigo tem lotes — seleção obrigatória.
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-1 pr-2">
                      <input
                        className="input w-full"
                        value={ln.note ?? ""}
                        onChange={(e) =>
                          updateLine(ln.id, { note: e.target.value })
                        }
                      />
                    </td>

                    <td className="py-1">
                      <button
                        className="btn-secondary w-full"
                        onClick={() => removeLine(ln.id)}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr>
                  <td className="py-3 text-sm text-gray-500" colSpan={5}>
                    Nenhuma linha adicionada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-gray-500 mt-3">
          Nota: quando o artigo tem lotes, a seleção de Lote é obrigatória. Se
          não tiver lotes, aplica-se FEFO automaticamente na confirmação.
        </div>
      </div>
    </div>
  );
}
