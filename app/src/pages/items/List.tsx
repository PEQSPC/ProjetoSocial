// src/pages/items/List.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, PencilLine, Trash2 } from "lucide-react";
import { useItems } from "@/hooks/useItems";
import { useFamilies } from "@/hooks/useFamilies";
import type { Item } from "@/domain/schemas";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import qk, { type Id, type ListParams } from "@/lib/queryKeys";
import { api } from "@/lib/api";

/* --------------------------- helpers --------------------------- */
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

/* -------- fetch leve para “próxima validade” por item -------- */
type StockLotRow = {
  id: Id;
  itemId: Id;
  lot: string;
  quantity: number;
  remainingQty: number;
  entryDate: string;
  expiryDate?: string;
  donorId?: Id;
};
type NextExpiryResult = {
  expiryDate?: string;
  exists: boolean;
  loading: boolean;
  error?: string;
};

function useNextExpiry(itemId: Id): NextExpiryResult {
  const params: Record<string, unknown> = {
    itemId: String(itemId),
    remainingQty_gte: 1,
    _sort: "expiryDate",
    _order: "asc",
    _limit: 1,
  };

  const queryKey = [
    ...qk.stockLots.byItem(itemId),
    {
      remainingQty_gte: 1,
      _sort: "expiryDate",
      _order: "asc",
      _limit: 1,
    } as ListParams,
  ];

  const q = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get<StockLotRow[]>("/stock_lots", {
        params,
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return res.data;
    },
    staleTime: 20_000,
  });

  if (q.isLoading) return { exists: false, loading: true };
  if (q.isError) return { exists: false, loading: false, error: "error" };

  const first = q.data?.[0];
  return {
    exists: !!first?.expiryDate,
    expiryDate: first?.expiryDate,
    loading: false,
  };
}

/* ------------------------ célula reutilizável ------------------------ */
function NextExpiryCell({ itemId }: { itemId: Id }) {
  const { expiryDate, exists, loading } = useNextExpiry(itemId);

  if (loading) return <span className="text-slate-400">…</span>;
  if (!exists || !expiryDate) return <span className="text-slate-500">—</span>;

  const d = daysUntil(expiryDate);
  const badge =
    d !== undefined && d < 0 ? (
      <span className="badge bg-red-100 text-red-700">Vencido</span>
    ) : d !== undefined && d <= 30 ? (
      <span className="badge bg-amber-100 text-amber-700">{d} dias</span>
    ) : null;

  return (
    <div className="flex items-center gap-2">
      <span>{fmtDate(expiryDate)}</span>
      {badge}
    </div>
  );
}

/* ----------------------------- página ----------------------------- */
export default function ItemsList() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // pesquisa com debounce
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchRaw), 250);
    return () => clearTimeout(t);
  }, [searchRaw]);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useItems({
    q: search,
    page,
    pageSize,
    sortBy: "name",
    sortDir: "asc",
  });

  // Carrega famílias e cria um mapa id->name para a coluna
  const fams = useFamilies({
    page: 1,
    pageSize: 1000,
    sortBy: "name",
    sortDir: "asc",
  });
  const familyMap = useMemo(() => {
    const m = new Map<string | number, string>();
    (fams.data?.items ?? []).forEach((f) => m.set(f.id, f.name));
    return m;
  }, [fams.data?.items]);

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pageCount ?? 1;

  useEffect(() => setPage(1), [search]);

  async function handleDelete(it: Item) {
    if (!confirm(`Eliminar artigo "${it.name}"?`)) return;
    await api.delete(`/items/${it.id}`, {
      validateStatus: (s) => s >= 200 && s < 300,
    });
    void qc.invalidateQueries({ queryKey: qk.items.root });
    void qc.invalidateQueries({ queryKey: qk.stockLots.byItem(it.id) });
  }

  const header = useMemo(
    () => (
      <div className="toolbar justify-between mb-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Pesquisar por SKU, nome, EAN…"
            className="input pl-9"
          />
        </div>
        <Link to="/items/create" className="btn-primary">
          <Plus className="size-4" /> Criar
        </Link>
      </div>
    ),
    [searchRaw]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Artigos</h1>
      {header}

      <div className="table-wrap">
        <div className="scroll relative">
          <table className="data">
            <thead className="sticky top-0 bg-white/90 backdrop-blur z-10">
              <tr>
                <th className="th w-[9rem]">SKU</th>
                <th className="th w-[18rem]">Nome</th>
                <th className="th w-[12rem]">Família</th>
                <th className="th w-[7rem]">Unidade</th>
                <th className="th w-[8rem]">Stock</th>
                <th className="th w-[11rem]">Validade (próx.)</th>
                <th className="th w-[10rem] sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-20">
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
                    Sem resultados
                  </td>
                </tr>
              ) : (
                rows.map((it: Item) => (
                  <tr key={String(it.id)} className="row hover:bg-emerald-50">
                    <td className="td font-medium text-slate-700">{it.sku}</td>

                    <td className="td">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{it.name}</div>
                        {it.eanCodes && it.eanCodes.length > 0 && (
                          <div className="truncate text-xs text-slate-500">
                            EAN: {it.eanCodes.join(", ")}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="td">
                      {it.familyId
                        ? familyMap.get(it.familyId) ?? String(it.familyId)
                        : "—"}
                    </td>

                    <td className="td">{it.unit}</td>
                    <td className="td">{it.stockCurrent ?? 0}</td>
                    <td className="td">
                      <NextExpiryCell itemId={it.id} />
                    </td>

                    <td className="td sticky right-0 bg-white/95 backdrop-blur border-l border-slate-200 z-10">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          className="btn"
                          onClick={() => navigate(`/items/${it.id}/edit`)}
                          title="Editar"
                        >
                          <PencilLine className="size-4" />
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(it)}
                          title="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
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
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm">
              {page} / {Math.max(1, totalPages)}
            </span>
            <button
              disabled={page >= (totalPages || 1)}
              onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
              className="btn disabled:opacity-50"
            >
              Seguinte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
