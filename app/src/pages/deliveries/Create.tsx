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
  lot?: string | null; // nome do lote (prioritário para exibição)
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
  ean?: string | null;
};

/* ===== Helpers ===== */
function newId(): string {
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
    { id: newId(), itemId: "", quantity: 1, lot: undefined, note: "", ean: "" },
  ]);
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
      {
        id: newId(),
        itemId: "",
        quantity: 1,
        lot: undefined,
        note: "",
        ean: "",
      },
    ]);
  }
  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  /* ===== EAN por linha ===== */
  async function handleEanEnter(lineId: string) {
    const ln = lines.find((l) => l.id === lineId);
    if (!ln) return;

    const code = (ln.ean ?? "").trim();
    if (!code) return;

    const found = itemByEAN.get(code);
    if (!found) {
      setMsg(`EAN ${code} não corresponde a nenhum artigo.`);
      return;
    }

    await ensureLotsLoaded(found.id);

    const lots = lotsFor(found.id);
    const autoLot = lots.length === 1 ? lots[0].id : ln.lot ?? null;

    updateLine(lineId, { itemId: found.id, lot: autoLot });
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
    <div className="px-6 py-12 max-w-6xl mx-auto">
      {/* Toolbar topo */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nova entrega</h1>
        <div className="flex items-center gap-2">
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

      {/* Card Dados */}
      <div className="card card-elevated p-6 rounded-2xl shadow-md mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col">
            <label className="text-sm mb-1">Beneficiário</label>
            <select
              className="input"
              value={beneficiaryId}
              onChange={(e) => setBeneficiaryId(e.target.value)}
            >
              <option value="">— selecione —</option>
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

      {/* Card Linhas */}
      <div className="card card-elevated p-6 rounded-2xl shadow-md mb-12">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Linhas</h2>
          <button className="btn" onClick={addLine}>
            + Adicionar linha
          </button>
        </div>

        {/* Cabeçalhos visuais no mesmo grid da doação */}
        <div className="grid items-center gap-3 md:grid-cols-[minmax(220px,1fr)_96px_280px_1fr_220px_90px] text-sm text-slate-500">
          <div>Artigo</div>
          <div>Qtd</div>
          <div>Lote</div>
          <div>Nota</div>
          <div>EAN</div>
          <div></div>
        </div>

        {/* Linhas */}
        <div className="mt-1 space-y-3">
          {lines.map((ln) => {
            const lots = lotsFor(ln.itemId);
            const requireLot = ln.itemId && lots.length > 0;
            return (
              <div
                key={ln.id}
                className="grid items-center gap-3 md:grid-cols-[minmax(220px,1fr)_96px_280px_1fr_220px_90px]"
              >
                {/* Artigo */}
                <select
                  className="input w-full"
                  value={ln.itemId}
                  onChange={async (e) => {
                    const itemId = e.target.value;
                    await ensureLotsLoaded(itemId);
                    await updateLine(ln.id, { itemId });
                  }}
                >
                  <option value="">— selecione —</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name ?? it.id}
                    </option>
                  ))}
                </select>

                {/* Qtd */}
                <input
                  type="number"
                  min={1}
                  className="input w-full text-center"
                  value={ln.quantity}
                  onChange={(e) =>
                    updateLine(ln.id, { quantity: Number(e.target.value) || 1 })
                  }
                />

                {/* Lote */}
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

                {/* Nota linha */}
                <input
                  className="input w-full"
                  value={ln.note ?? ""}
                  onChange={(e) => updateLine(ln.id, { note: e.target.value })}
                  placeholder="Observações…"
                />

                {/* EAN */}
                <input
                  className="input w-full"
                  value={ln.ean ?? ""}
                  onChange={(e) => updateLine(ln.id, { ean: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEanEnter(ln.id);
                  }}
                  placeholder="Leia o código…"
                />

                {/* Remover */}
                <div className="flex justify-end">
                  <button
                    className="btn-secondary"
                    onClick={() => removeLine(ln.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}

          {lines.length === 0 && (
            <div className="text-sm text-gray-500">
              Nenhuma linha adicionada.
            </div>
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="text-xs text-gray-500 mt-4">
          Nota: quando o artigo tem lotes, a seleção de Lote é obrigatória. Se
          não tiver lotes, aplica-se FEFO automaticamente na confirmação.
        </div>

        {msg && <div className="text-sm text-red-600 mt-3">{msg}</div>}
      </div>
    </div>
  );
}
