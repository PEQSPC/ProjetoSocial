import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk, { type ListParams } from "@/lib/queryKeys";
import type { Donor } from "@/domain/schemas";

export type DonorsListParams = ListParams & {
  clientFilter?: (d: Donor) => boolean;
};

export interface DonorsPage {
  items: Donor[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

function buildQueryParams(p?: DonorsListParams) {
  const page = Math.max(1, p?.page ?? 1);
  const pageSize = Math.max(1, p?.pageSize ?? 100);
  const params: Record<string, unknown> = { _page: page, _limit: pageSize };

  if (p?.q && p.q.trim()) params.q = p.q.trim();
  if (p?.sortBy) {
    params._sort = p.sortBy;
    params._order = p.sortDir ?? "asc";
  }
  if (p?.filters) for (const [k, v] of Object.entries(p.filters)) params[k] = v;

  return { params, page, pageSize };
}

export function useDonors(p?: DonorsListParams) {
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
    queryKey: keyParams ? qk.donors.list(keyParams) : qk.donors.root,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    queryFn: async (): Promise<DonorsPage> => {
      const res = await api.get<Donor[]>("/donors", {
        params,
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const totalHeader = res.headers["x-total-count"];
      const total =
        typeof totalHeader === "string"
          ? parseInt(totalHeader, 10)
          : Number(totalHeader ?? 0);

      let items = res.data;
      if (p?.clientFilter) items = items.filter(p.clientFilter);

      const effectiveTotal = total || items.length;
      const pageCount = Math.max(1, Math.ceil(effectiveTotal / pageSize));

      return { items, page, pageSize, total: effectiveTotal, pageCount };
    },
  });
}
