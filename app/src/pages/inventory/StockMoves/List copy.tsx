import { useEffect, useState } from "react";
import { useStockMoves } from "@/hooks/useStockMoves";
import { Search } from "lucide-react";

function TypeBadge({ t }: { t: "IN" | "OUT" | "ADJUST" | "TRANSFER" }) {
  const map = {
    IN: "bg-emerald-100 text-emerald-700",
    OUT: "bg-sky-100 text-sky-700",
    ADJUST: "bg-amber-100 text-amber-700",
    TRANSFER: "bg-violet-100 text-violet-700",
  } as const;
  return <span className={`badge ${map[t]}`}>{t}</span>;
}

export default function StockMovesList() {
  const [qRaw, setQRaw] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(qRaw), 250);
    return () => clearTimeout(t);
  }, [qRaw]);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useStockMoves({
    q,
    page,
    pageSize,
    sortBy: "createdAt",
    sortDir: "desc",
  });

  useEffect(() => {
    setPage(1);
  }, [q]);

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.pageCount ?? 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Movimentos de Stock
        </h1>
      </div>

      <div className="toolbar justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Pesquisar por artigo/lote/utilizador/motivo…"
            value={qRaw}
            onChange={(e) => setQRaw(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
        <div className="scroll">
          <table className="data">
            <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
              <tr>
                <th className="th w-[10rem]">Data</th>
                <th className="th w-[12rem]">Artigo</th>
                <th className="th w-[10rem]">Lote</th>
                <th className="th w-[8rem]">Tipo</th>
                <th className="th w-[8rem]">Qtd</th>
                <th className="th w-[12rem]">Utilizador</th>
                <th className="th">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
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
                rows.map((m) => (
                  <tr key={String(m.id)} className="row hover:bg-emerald-50">
                    <td className="td">{m.createdAt ?? ""}</td>
                    <td className="td">{String(m.itemId)}</td>
                    <td className="td">{String(m.lotId)}</td>
                    <td className="td">
                      <TypeBadge t={m.type} />
                    </td>
                    <td className="td">{m.quantity}</td>
                    <td className="td">{m.user ?? "—"}</td>
                    <td className="td">{m.reason ?? "—"}</td>
                  </tr>
                ))
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
  );
}
