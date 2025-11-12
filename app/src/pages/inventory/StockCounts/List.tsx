// src/pages/inventory/StockMoves/List.tsx
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useStockMoves } from "@/hooks/useStockMoves";
import { useItems } from "@/hooks/useItems";
import { useStockLots } from "@/hooks/useStockLots";

import type { StockMove } from "@/domain/schemas";

/* Pequena ajuda visual para o tipo do movimento */
function TypePill({ t }: { t: StockMove["type"] }) {
  const cls =
    t === "IN"
      ? "bg-emerald-100 text-emerald-700"
      : t === "OUT"
      ? "bg-red-100 text-red-700"
      : t === "ADJUST"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700"; // TRANSFER
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {t}
    </span>
  );
}

/* Formatação simples de data ISO */
function fmtISO(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(+dt)) return d;
  return dt.toLocaleString("pt-PT");
}

export default function StockMovesList() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Dados base dos movimentos
  const movesQ = useStockMoves({
    q,
    page,
    pageSize,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const rows = movesQ.data?.items ?? [];
  const total = movesQ.data?.total ?? 0;
  const totalPages = Math.max(1, movesQ.data?.pageCount ?? 1);

  // Tabelas auxiliares para resolver labels
  const itemsQ = useItems({
    page: 1,
    pageSize: 2000,
    sortBy: "name",
    sortDir: "asc",
  });
  const lotsQ = useStockLots({
    page: 1,
    pageSize: 20000,
    sortBy: "entryDate",
    sortDir: "desc",
  });

  const itemMap = useMemo(() => {
    const m = new Map<string, { sku: string; name: string }>();
    (itemsQ.data?.items ?? []).forEach((it) => {
      m.set(String(it.id), { sku: it.sku, name: it.name });
    });
    return m;
  }, [itemsQ.data?.items]);

  const lotMap = useMemo(() => {
    const m = new Map<string, { lot: string }>();
    (lotsQ.data?.items ?? []).forEach((l) => {
      m.set(String(l.id), { lot: l.lot });
    });
    return m;
  }, [lotsQ.data?.items]);

  // reset de página quando a pesquisa muda
  function onSearch(v: string) {
    setQ(v);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Movimentos de Stock
      </h1>

      <div className="toolbar">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Pesquisar por artigo/lote/utilizador/motivo…"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card p-0">
        <div className="table-wrap">
          <div className="scroll overflow-x-hidden">
            <table className="data table-fixed w-full">
              <colgroup>
                <col style={{ width: "16%" }} /> {/* Data */}
                <col style={{ width: "28%" }} /> {/* Artigo */}
                <col style={{ width: "16%" }} /> {/* Lote */}
                <col style={{ width: "8%" }} /> {/* Tipo */}
                <col style={{ width: "8%" }} /> {/* Qtd */}
                <col style={{ width: "12%" }} /> {/* Utilizador */}
                <col style={{ width: "12%" }} /> {/* Motivo */}
              </colgroup>
              <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
                <tr>
                  <th className="th">Data</th>
                  <th className="th">Artigo</th>
                  <th className="th">Lote</th>
                  <th className="th">Tipo</th>
                  <th className="th">Qtd</th>
                  <th className="th">Utilizador</th>
                  <th className="th">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movesQ.isLoading ? (
                  <tr>
                    <td className="td py-10 text-center" colSpan={7}>
                      A carregar…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      className="td py-10 text-center text-slate-500"
                      colSpan={7}
                    >
                      Sem movimentos
                    </td>
                  </tr>
                ) : (
                  rows.map((mv) => {
                    const im = itemMap.get(String(mv.itemId));
                    const lm = lotMap.get(String(mv.lotId));
                    const itemLabel = im
                      ? `${im.sku} — ${im.name}`
                      : String(mv.itemId);
                    const lotLabel = lm
                      ? lm.lot === "NOLOT"
                        ? "Sem lote"
                        : lm.lot
                      : String(mv.lotId);

                    return (
                      <tr
                        key={String(mv.id)}
                        className="row hover:bg-emerald-50/40"
                      >
                        <td className="td">{fmtISO(mv.createdAt)}</td>
                        <td className="td">
                          <div className="truncate">{itemLabel}</div>
                        </td>
                        <td className="td">
                          <div className="truncate">{lotLabel}</div>
                        </td>
                        <td className="td">
                          <TypePill t={mv.type} />
                        </td>
                        <td className="td">{mv.quantity}</td>
                        <td className="td">{mv.user ?? "—"}</td>
                        <td className="td">{mv.reason ?? "—"}</td>
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
      </div>
    </div>
  );
}
