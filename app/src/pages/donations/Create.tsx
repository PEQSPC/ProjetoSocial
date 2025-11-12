import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useDonors } from "@/hooks/useDonors";
import { useItems } from "@/hooks/useItems";
import { donationsPath, donationLinesPath } from "@/adapters/donations";
import type { Donor, Item } from "@/domain/schemas";

/* ========================= helpers ========================= */

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

// aceita tanto T[] como { items: T[] }
type MaybePage<T> = T[] | { items: T[] } | undefined | null;
function isPage<T>(v: MaybePage<T>): v is { items: T[] } {
  return (
    !!v &&
    typeof v === "object" &&
    "items" in v &&
    Array.isArray((v as { items: T[] }).items)
  );
}
function toArray<T>(v: MaybePage<T>): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : isPage<T>(v) ? v.items : [];
}

/* Tipagem mínima para stock_lots (só o que usamos) */
type StockLotRow = {
  id?: string | number;
  itemId?: string | number;
  lot?: string;
  quantity?: number;
  remainingQty?: number;
  expiryDate?: string | null;
  locationCode?: string | null;
};

/* ========================= componente ========================= */

type NewLine = {
  itemId?: string;
  quantity: number;
  lot?: string;
  expiryDate?: string;
  locationCode?: string;
  note?: string;
  ean?: string;
};

export default function DonationCreate() {
  const nav = useNavigate();

  // dados base
  const donorsQ = useDonors({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });
  const itemsQ = useItems({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });

  // sem "any": aceita T[] ou { items: T[] }
  const donors: Donor[] = toArray<Donor>(donorsQ.data as MaybePage<Donor>);
  const items: Item[] = toArray<Item>(itemsQ.data as MaybePage<Item>);

  /* ------------ Cabeçalho ------------ */
  const [date, setDate] = useState(todayYMD());
  const [donorId, setDonorId] = useState<string>("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  /* ------------ Linhas (multi) ------------ */
  const [lines, setLines] = useState<NewLine[]>([
    {
      itemId: "",
      quantity: 1,
      lot: `L-${todayYMD()}`,
      expiryDate: "",
      locationCode: "",
      note: "",
      ean: "",
    },
  ]);

  const addLine = () =>
    setLines((ls) => [
      ...ls,
      { itemId: "", quantity: 1, lot: `L-${todayYMD()}`, ean: "" },
    ]);

  const removeLine = (ix: number) =>
    setLines((ls) => ls.filter((_, i) => i !== ix));

  const updateLine = (ix: number, patch: Partial<NewLine>) =>
    setLines((ls) => ls.map((l, i) => (i === ix ? { ...l, ...patch } : l)));

  // chave estável dos EANs para usar como dependência
  const eansKey = useMemo(
    () => lines.map((l) => l.ean ?? "").join("|"),
    [lines]
  );

  // Preenchimento automático do artigo via EAN
  useEffect(() => {
    setLines((ls) =>
      ls.map((l) => {
        if (!l.ean) return l;
        const it = items.find((i) => (i.eanCodes ?? []).includes(l.ean!));
        return it ? { ...l, itemId: String(it.id) } : l;
      })
    );
  }, [items, eansKey]);

  /* ------------ Import XLSX ------------ */
  const fileRef = useRef<HTMLInputElement>(null);
  const onPickFile = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const XLSX = await import("xlsx");
    const data = await f.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];

    type Row = Partial<{
      sku: string;
      itemId: string;
      ean: string;
      quantity: number | string;
      lot: string;
      expiryDate: string;
      locationCode: string;
      note: string;
    }>;

    const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });

    const imported: NewLine[] = rows.map((r) => ({
      itemId: (r.itemId ?? "").toString().trim() || undefined,
      quantity: Number(r.quantity ?? 1),
      lot: r.lot || undefined,
      expiryDate: r.expiryDate || undefined,
      locationCode: r.locationCode || undefined,
      note: r.note || undefined,
      ean: r.ean || undefined,
    }));

    setLines((ls) => [...ls, ...imported]);
    e.target.value = ""; // limpar input
  };

  /* ------------ Guardar ------------ */
  const canSave =
    !!donorId &&
    !!date &&
    lines.some((l) => (l.itemId || l.ean) && l.quantity > 0);

  const onSave = async () => {
    if (!canSave) return;

    // 1) Cabeçalho
    const donorName = donors.find(
      (d) => String(d.id) === String(donorId)
    )?.name;
    const headRes = await api.post(donationsPath, {
      date,
      donorId,
      donorName, // denormalizado
      reference: reference || null,
      note: note || null,
    });
    const newId: string = String(headRes.data?.id ?? "");

    // 2) Linhas + stock
    for (const l of lines) {
      let finalItemId = l.itemId ?? "";

      // Resolver artigo por EAN se necessário
      if (!finalItemId && l.ean) {
        const it = items.find((i) => (i.eanCodes ?? []).includes(l.ean!));
        if (it) finalItemId = String(it.id);
      }
      if (!finalItemId) continue; // sem artigo, ignora

      const itName = items.find(
        (i) => String(i.id) === String(finalItemId)
      )?.name;

      await api.post(donationLinesPath, {
        donationId: newId,
        itemId: finalItemId,
        itemName: itName, // denormalizado
        quantity: Number(l.quantity ?? 1),
        lot: l.lot || null,
        expiryDate: l.expiryDate || null,
        locationCode: l.locationCode || null,
        note: l.note || null,
      });

      // 2.1 criar/atualizar lote (se informado)
      if (l.lot) {
        const lotRes = await api.get<StockLotRow[]>("/stock_lots", {
          params: { itemId: finalItemId, lot: l.lot },
        });
        const lotRows = Array.isArray(lotRes.data) ? lotRes.data : [];
        if (lotRows.length) {
          const existing = lotRows[0];
          await api.patch(`/stock_lots/${existing.id}`, {
            quantity: Number(existing.quantity ?? 0) + Number(l.quantity ?? 0),
            remainingQty:
              Number(existing.remainingQty ?? 0) + Number(l.quantity ?? 0),
            expiryDate: l.expiryDate || existing.expiryDate || null,
            locationCode: l.locationCode || existing.locationCode || null,
          });
        } else {
          await api.post("/stock_lots", {
            itemId: finalItemId,
            lot: l.lot,
            quantity: Number(l.quantity ?? 0),
            remainingQty: Number(l.quantity ?? 0),
            entryDate: todayYMD(),
            expiryDate: l.expiryDate || null,
            locationCode: l.locationCode || null,
            donorId,
          });
        }
      }

      // 2.2 recalcular stockCurrent do item
      const lotsRes = await api.get<StockLotRow[]>("/stock_lots", {
        params: { itemId: finalItemId },
      });
      const lots = Array.isArray(lotsRes.data) ? lotsRes.data : [];
      const total = lots.reduce(
        (acc, t) => acc + Number(t.remainingQty ?? 0),
        0
      );
      await api.patch(`/items/${finalItemId}`, { stockCurrent: total });
    }

    nav(`/donations/${newId}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nova doação</h1>

      {/* Cabeçalho */}
      <div className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-500">Data</label>
          <input
            type="date"
            className="input w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">Doador</label>
          <select
            className="input w-full"
            value={donorId}
            onChange={(e) => setDonorId(e.target.value)}
          >
            <option value="">— selecione —</option>
            {donors.map((d) => (
              <option key={String(d.id)} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-500">Referência</label>
          <input
            className="input w-full"
            placeholder="Ex: DOC-2025-001"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-500">Notas</label>
          <input
            className="input w-full"
            placeholder="Observações..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {/* Linhas */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Linhas</h2>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onPickFile}>
              Importar XLSX
            </button>
            <button className="btn" onClick={addLine}>
              + Adicionar linha
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onFile}
          />
        </div>

        {lines.map((l, ix) => (
          <div
            key={ix}
            className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end"
          >
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500">Artigo</label>
              <select
                className="input w-full"
                value={l.itemId ?? ""}
                onChange={(e) => updateLine(ix, { itemId: e.target.value })}
              >
                <option value="">— selecione —</option>
                {items.map((it) => (
                  <option key={String(it.id)} value={String(it.id)}>
                    {it.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-500">Qtd</label>
              <input
                type="number"
                min={1}
                className="input w-full"
                value={l.quantity}
                onChange={(e) =>
                  updateLine(ix, { quantity: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Lote</label>
              <input
                className="input w-full"
                placeholder={`L-${todayYMD()}`}
                value={l.lot ?? ""}
                onChange={(e) => updateLine(ix, { lot: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Validade</label>
              <input
                type="date"
                className="input w-full"
                value={l.expiryDate ?? ""}
                onChange={(e) => updateLine(ix, { expiryDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Local</label>
              <input
                className="input w-full"
                placeholder="Ex: A1-03"
                value={l.locationCode ?? ""}
                onChange={(e) =>
                  updateLine(ix, { locationCode: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm text-gray-500">EAN</label>
                <input
                  className="input w-full"
                  placeholder="Leia o código…"
                  value={l.ean ?? ""}
                  onChange={(e) => updateLine(ix, { ean: e.target.value })}
                />
              </div>
              <button
                className="btn-secondary h-10 mt-5"
                onClick={() => removeLine(ix)}
              >
                ✕
              </button>
            </div>

            <div className="md:col-span-7">
              <label className="text-sm text-gray-500">Notas linha</label>
              <input
                className="input w-full"
                placeholder="Observações…"
                value={l.note ?? ""}
                onChange={(e) => updateLine(ix, { note: e.target.value })}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={() => nav("/donations")}>
            Cancelar
          </button>
          <button className="btn" disabled={!canSave} onClick={onSave}>
            Gravar doação
          </button>
        </div>
      </div>
    </div>
  );
}
