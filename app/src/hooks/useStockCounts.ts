// src/hooks/useStockCounts.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk, { type ListParams } from "@/lib/queryKeys";
import {
  stockCountsPath,
  toStockCounts,
  type StockCountDTO,
} from "@/adapters/stockCounts";
import type { StockCount } from "@/domain/schemas";

export type StockCountsListParams = ListParams & {
  status?: "OPEN" | "CLOSED";
};

export interface StockCountsPage {
  items: StockCount[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

function buildParams(p?: StockCountsListParams) {
  const page = Math.max(1, p?.page ?? 1);
  const pageSize = Math.max(1, p?.pageSize ?? 10);
  const params: Record<string, unknown> = { _page: page, _limit: pageSize };

  if (p?.q && p.q.trim()) params.q = p.q.trim();
  if (p?.status) params.status = p.status;
  if (p?.sortBy) {
    params._sort = p.sortBy;
    params._order = p.sortDir ?? "desc";
  }
  if (p?.filters) for (const [k, v] of Object.entries(p.filters)) params[k] = v;

  return { params, page, pageSize };
}

export function useStockCounts(p?: StockCountsListParams) {
  const { params, page, pageSize } = buildParams(p);
  const key = p
    ? qk.stockCounts.list({
        q: p.q,
        page: p.page,
        pageSize: p.pageSize,
        sortBy: p.sortBy,
        sortDir: p.sortDir,
        filters: p.filters,
      })
    : qk.stockCounts.root;

  return useQuery({
    queryKey: key,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    queryFn: async (): Promise<StockCountsPage> => {
      const res = await api.get<StockCountDTO[]>(stockCountsPath, {
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

      const items = toStockCounts(res.data);
      const total =
        Number.isFinite(rawTotal) && rawTotal > 0 ? rawTotal : items.length;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      return { items, page, pageSize, total, pageCount };
    },
  });
}
