import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id, type ListParams } from "@/lib/queryKeys";
import {
  stockLotsPath,
  toStockLots,
  type StockLotDTO,
} from "@/adapters/stockLots";
import type { StockLot } from "@/domain/schemas";

export type StockLotsListParams = ListParams & {
  itemId?: Id; // se passado, filtra por item
  clientFilter?: (l: StockLot) => boolean;
};

export interface StockLotsPage {
  items: StockLot[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

function buildQueryParams(p?: StockLotsListParams) {
  const page = Math.max(1, p?.page ?? 1);
  const pageSize = Math.max(1, p?.pageSize ?? 10);
  const params: Record<string, unknown> = { _page: page, _limit: pageSize };

  if (p?.itemId !== undefined) params.itemId = p.itemId;
  if (p?.q && p.q.trim()) params.q = p.q.trim();
  if (p?.sortBy) {
    params._sort = p.sortBy;
    params._order = p.sortDir ?? "asc";
  }
  if (p?.filters) for (const [k, v] of Object.entries(p.filters)) params[k] = v;

  return { params, page, pageSize };
}

export function useStockLots(p?: StockLotsListParams) {
  const { params, page, pageSize } = buildQueryParams(p);

  // queryKey diferenciada se tiver itemId
  const key =
    p?.itemId !== undefined
      ? qk.stockLots.byItemList(p.itemId, {
          q: p?.q,
          page: p?.page,
          pageSize: p?.pageSize,
          sortBy: p?.sortBy,
          sortDir: p?.sortDir,
          filters: p?.filters,
        })
      : p
      ? qk.stockLots.list({
          q: p.q,
          page: p.page,
          pageSize: p.pageSize,
          sortBy: p.sortBy,
          sortDir: p.sortDir,
          filters: p.filters,
        })
      : qk.stockLots.root;

  return useQuery({
    queryKey: key,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    queryFn: async (): Promise<StockLotsPage> => {
      const res = await api.get<StockLotDTO[]>(stockLotsPath, {
        params,
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const totalHeader = res.headers["x-total-count"];
      const total =
        typeof totalHeader === "string"
          ? parseInt(totalHeader, 10)
          : Number(totalHeader ?? 0);

      let items = toStockLots(res.data);
      if (p?.clientFilter) items = items.filter(p.clientFilter);

      const effectiveTotal = total || items.length;
      const pageCount = Math.max(1, Math.ceil(effectiveTotal / pageSize));

      return { items, page, pageSize, total: effectiveTotal, pageCount };
    },
  });
}
