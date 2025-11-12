import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type ListParams } from "@/lib/queryKeys";
import { familiesPath, toFamilies, type FamilyDTO } from "@/adapters/families";
import type { Family } from "@/domain/schemas";

/** Parâmetros aceites pela listagem de famílias. */
export type FamiliesListParams = ListParams & {
  /** Filtro adicional no cliente (aplicado após resposta do servidor). */
  clientFilter?: (f: Family) => boolean;
};

export interface FamiliesPage {
  items: Family[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

/** Constrói os parâmetros para o json-server. */
function buildQueryParams(p?: FamiliesListParams) {
  const params: Record<string, unknown> = {};

  const page = Math.max(1, p?.page ?? 1);
  const pageSize = Math.max(1, p?.pageSize ?? 10);

  // Paginação json-server
  params._page = page;
  params._limit = pageSize;

  // Pesquisa full-text do json-server
  if (p?.q && p.q.trim()) params.q = p.q.trim();

  // Ordenação (opcional)
  if (p?.sortBy) {
    params._sort = p.sortBy;
    params._order = p.sortDir ?? "asc";
  }

  // Filtros adicionais (json-server interpreta como equals)
  if (p?.filters) {
    for (const [k, v] of Object.entries(p.filters)) {
      params[k] = v as unknown;
    }
  }

  return { params, page, pageSize };
}

export function useFamilies(p?: FamiliesListParams) {
  const { params, page, pageSize } = buildQueryParams(p);

  // ---- FIX: remover clientFilter da key (ListParams não o conhece)
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
    queryKey: keyParams ? qk.families.list(keyParams) : qk.families.root,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    queryFn: async (): Promise<FamiliesPage> => {
      const res = await api.get<FamilyDTO[]>(familiesPath, {
        params,
        validateStatus: (s) => s >= 200 && s < 300,
      });

      const totalHeader = res.headers["x-total-count"];
      const total =
        typeof totalHeader === "string"
          ? parseInt(totalHeader, 10)
          : Number(totalHeader ?? 0);

      // DTO -> domínio
      let items = toFamilies(res.data);

      // filtro adicional no cliente (não altera o total do servidor)
      if (p?.clientFilter) {
        items = items.filter(p.clientFilter);
      }

      const effectiveTotal = total || items.length;
      const pageCount = Math.max(1, Math.ceil(effectiveTotal / pageSize));

      return {
        items,
        page,
        pageSize,
        total: effectiveTotal,
        pageCount,
      };
    },
  });
}
