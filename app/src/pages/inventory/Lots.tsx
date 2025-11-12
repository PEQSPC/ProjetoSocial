// src/pages/inventory/Lots.tsx
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useStockLots } from "@/hooks/useStockLots";
import { useItems } from "@/hooks/useItems";
import { useFamilies } from "@/hooks/useFamilies";
import { useAdjustStockLot } from "@/hooks/useAdjustStockLot";

import { fmtDDMMYYYY } from "@/utils/dates";
import { useDebouncedValue } from "@/utils/useDebouncedValue";
import type { Item } from "@/domain/schemas";

/* ---------------- helpers locais ---------------- */
function daysUntil(date?: string): number | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  if (isNaN(+d)) return undefined;
  const now = new Date();
  const t0 = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const t1 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((t1 - t0) / 86400000);
}
function tone(entry?: string, expiry?: string) {
  if (!expiry) return "";
  const d = daysUntil(expiry);
  if (d === undefined) return "";
  if (d < 0) return "bg-red-50";
  if (d <= 30) return "bg-amber-50";
  if (entry && new Date(expiry) < new Date(entry)) return "bg-red-50";
  return "";
}

/* ========================================================= */

export default function InventoryLots() {
  // filtros & pesquisa
  const [search, setSearch] = useState("");
  const [familyId, setFamilyId] = useState<string>("");
  const [eanScan, setEanScan] = useState(""); // bónus: filtrar por EAN
  const debouncedQ = useDebouncedValue(search, 250);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  // dados auxiliares (famílias e artigos para metadados)
  const fams = useFamilies({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });
  const items = useItems({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });

  // lista de lotes (com pesquisa/paginação do servidor)
  const { data, isLoading } = useStockLots({ q: debouncedQ, page, pageSize });
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // idItem -> metadados do artigo
  const itemMap = useMemo(() => {
    type Meta = {
      name: string;
      sku: string;
      familyId?: Item["familyId"];
      unit?: Item["unit"];
      eans: string[];
      locationCode?: string;
    };
    const map = new Map<Item["id"], Meta>();
    const list = (items.data?.items ?? []) as Item[]; // tipar a origem

    list.forEach((it) => {
      map.set(it.id, {
        name: it.name,
        sku: it.sku,
        familyId: it.familyId,
        unit: it.unit,
        eans: it.eanCodes ?? [],
        locationCode: it.locationCode,
      });
    });

    return map;
  }, [items.data?.items]);

  // filtro por família e por EAN (client-side)
  const filtered = useMemo(() => {
    let arr = rows;
    if (familyId) {
      arr = arr.filter(
        (l) =>
          String(itemMap.get(l.itemId)?.familyId ?? "") === String(familyId)
      );
    }
    if (eanScan.trim()) {
      const needle = eanScan.trim();
      arr = arr.filter((l) =>
        (itemMap.get(l.itemId)?.eans ?? []).some((e) => e.includes(needle))
      );
    }
    return arr;
  }, [rows, familyId, eanScan, itemMap]);

  // reset da página sempre que se alteram filtros/pesquisa
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, familyId, eanScan]);

  // ajuste rápido de saldo
  const { mutate: adjustLot } = useAdjustStockLot();
  const [editing, setEditing] = useState<{
    id: string | number;
    itemId: string | number;
    cur: number;
  } | null>(null);
  const [newQty, setNewQty] = useState<number>(0);

  function openAdjust(
    id: string | number,
    itemId: string | number,
    cur: number
  ) {
    setEditing({ id, itemId, cur });
    setNewQty(cur);
  }
  function saveAdjust() {
    if (!editing) return;
    adjustLot({
      lotId: editing.id,
      itemId: editing.itemId,
      newRemaining: Number(newQty) || 0,
      reason: "Ajuste rápido",
    });
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Lotes</h1>

      {/* toolbar */}
      <div className="toolbar justify-between mb-4 gap-3">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por lote…"
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
          >
            <option value="">Todas as famílias</option>
            {(fams.data?.items ?? []).map((f) => (
              <option key={String(f.id)} value={String(f.id)}>
                {f.name}
              </option>
            ))}
          </select>
          {/* BÓNUS: filtrar/escanear EAN */}
          <input
            className="input w-[14rem]"
            placeholder="Scan/Escrever EAN…"
            value={eanScan}
            onChange={(e) => setEanScan(e.target.value)}
          />
        </div>
      </div>

      {/* tabela */}
      <div className="table-wrap">
        <div className="scroll relative">
          <table className="data">
            <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
              <tr>
                <th className="th w-[12rem]">SKU</th>
                <th className="th w-[20rem]">Artigo</th>
                <th className="th w-[12rem]">Lote</th>
                <th className="th w-[10rem]">Entrada</th>
                <th className="th w-[10rem]">Validade</th>
                <th className="th w-[8rem]">Saldo</th>
                <th className="th w-[10rem]">Localização</th>
                <th className="th w-[8rem] sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-20">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    className="td py-10 text-center text-slate-500"
                    colSpan={8}
                  >
                    A carregar…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    className="td py-14 text-center text-slate-500"
                    colSpan={8}
                  >
                    Sem resultados
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const meta = itemMap.get(l.itemId);
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
                      className={`row ${tone(l.entryDate, l.expiryDate)}`}
                    >
                      <td className="td text-slate-700 font-medium">
                        {meta?.sku ?? "—"}
                      </td>
                      <td className="td">
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {meta?.name ?? "—"}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {(meta?.eans ?? []).join(", ")}
                          </div>
                        </div>
                      </td>
                      <td className="td">{l.lot}</td>
                      <td className="td">
                        {l.entryDate ? fmtDDMMYYYY(l.entryDate) : "—"}
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <span>
                            {l.expiryDate ? fmtDDMMYYYY(l.expiryDate) : "—"}
                          </span>
                          {badge}
                        </div>
                      </td>
                      <td className="td">{l.remainingQty}</td>
                      <td className="td">
                        {l.locationCode ?? meta?.locationCode ?? "—"}
                      </td>
                      <td className="td sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-10 text-right">
                        <button
                          className="btn"
                          onClick={() =>
                            openAdjust(l.id, l.itemId, l.remainingQty)
                          }
                        >
                          Ajustar
                        </button>
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
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn disabled:opacity-50"
            >
              Seguinte
            </button>
          </div>
        </div>
      </div>

      {/* Modal simples de ajuste */}
      {editing && (
        <div className="fixed inset-0 bg-black/20 z-50 grid place-items-center p-4">
          <div className="card p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold">Ajustar saldo do lote</h3>
            <div>
              <label className="label">Novo saldo</label>
              <input
                type="number"
                min={0}
                className="input"
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Atual: {editing.cur}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button className="btn" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={saveAdjust}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
