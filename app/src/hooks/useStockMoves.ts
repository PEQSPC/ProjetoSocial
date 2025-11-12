// src/hooks/useStockMoves.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk, { type Id, type ListParams } from "@/lib/queryKeys";
import {
  stockMovesPath,
  toStockMoves,
  type StockMoveDTO,
} from "@/adapters/stockMoves";
import type { StockMove } from "@/domain/schemas";

export type StockMovesListParams = ListParams & {
  itemId?: Id;
  lotId?: Id;
  type?: "IN" | "OUT" | "ADJUST" | "TRANSFER";
  clientFilter?: (m: StockMove) => boolean;
};

export interface StockMovesPage {
  items: StockMove[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

function buildParams(p?: StockMovesListParams) {
  const page = Math.max(1, p?.page ?? 1);
  const pageSize = Math.max(1, p?.pageSize ?? 10);
  const params: Record<string, unknown> = { _page: page, _limit: pageSize };

  if (p?.q && p.q.trim()) params.q = p.q.trim();
  if (p?.itemId !== undefined) params.itemId = p.itemId;
  if (p?.lotId !== undefined) params.lotId = p.lotId;
  if (p?.type) params.type = p.type;

  if (p?.sortBy) {
    params._sort = p.sortBy;
    params._order = p.sortDir ?? "desc";
  }
  if (p?.filters) for (const [k, v] of Object.entries(p.filters)) params[k] = v;

  return { params, page, pageSize };
}

export function useStockMoves(p?: StockMovesListParams) {
  const { params, page, pageSize } = buildParams(p);

  const key = p
    ? qk.stockMoves.list({
        q: p.q,
        page: p.page,
        pageSize: p.pageSize,
        sortBy: p.sortBy,
        sortDir: p.sortDir,
        filters: p.filters,
      })
    : qk.stockMoves.root;

  return useQuery({
    queryKey: key,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    queryFn: async (): Promise<StockMovesPage> => {
      const res = await api.get<StockMoveDTO[]>(stockMovesPath, {
        params,
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const totalHeader = (res.headers as Record<string, unknown>)[
        "x-total-count"
      ];
      const rawTotal =
        typeof totalHeader === "string"
          ? parseInt(totalHeader, 10)
          : Number(totalHeader ?? 0);

      let items = toStockMoves(res.data);
      if (p?.clientFilter) items = items.filter(p.clientFilter);

      const total =
        Number.isFinite(rawTotal) && rawTotal > 0 ? rawTotal : items.length;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      return { items, page, pageSize, total, pageCount };
    },
  });
}
