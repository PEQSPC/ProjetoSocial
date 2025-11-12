import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type ListParams } from "@/lib/queryKeys";
import { itemsPath, toItems, type ItemDTO } from "@/adapters/items";
import type { Item } from "@/domain/schemas";

export type ItemsListParams = ListParams & {
  clientFilter?: (i: Item) => boolean;
};

export interface ItemsPage {
  items: Item[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

function buildQueryParams(p?: ItemsListParams) {
  const page = Math.max(1, p?.page ?? 1);
  const pageSize = Math.max(1, p?.pageSize ?? 10);
  const params: Record<string, unknown> = { _page: page, _limit: pageSize };

  if (p?.q && p.q.trim()) params.q = p.q.trim();
  if (p?.sortBy) {
    params._sort = p.sortBy;
    params._order = p.sortDir ?? "asc";
  }
  if (p?.filters) for (const [k, v] of Object.entries(p.filters)) params[k] = v;

  return { params, page, pageSize };
}

export function useItems(p?: ItemsListParams) {
  const { params, page, pageSize } = buildQueryParams(p);

  const keyParams: ListParams | undefined = p
    ? {
        q: p.q,
        page: p.page,
        pageSize: p.pageSize,
        sortBy: p.sortBy,
        sortDir: p.sortDir,
        filters: p.filters,
      }
    : undefined;

  return useQuery({
    queryKey: keyParams ? qk.items.list(keyParams) : qk.items.root,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    queryFn: async (): Promise<ItemsPage> => {
      const res = await api.get<ItemDTO[]>(itemsPath, {
        params,
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const totalHeader = res.headers["x-total-count"];
      const total =
        typeof totalHeader === "string"
          ? parseInt(totalHeader, 10)
          : Number(totalHeader ?? 0);

      let items = toItems(res.data);
      if (p?.clientFilter) items = items.filter(p.clientFilter);

      const effectiveTotal = total || items.length;
      const pageCount = Math.max(1, Math.ceil(effectiveTotal / pageSize));

      return { items, page, pageSize, total: effectiveTotal, pageCount };
    },
  });
}
