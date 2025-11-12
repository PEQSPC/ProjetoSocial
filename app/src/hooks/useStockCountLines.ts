// src/hooks/useStockCountLines.ts
import {
  useQuery,
  keepPreviousData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk, { type Id, type ListParams } from "@/lib/queryKeys";
import {
  stockCountLinesPath,
  toStockCountLines,
  type StockCountLineDTO,
  toStockCountLine,
} from "@/adapters/stockCounts";
import type { StockCountLine } from "@/domain/schemas";

/* ---------- Tipos ---------- */
export type CountLinesParams = ListParams & {
  countId: Id;
};

export interface CountLinesPage {
  items: StockCountLine[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

/* ---------- Helpers ---------- */
function buildParams(p: CountLinesParams) {
  const page = Math.max(1, p.page ?? 1);
  const pageSize = Math.max(1, p.pageSize ?? 50);
  const params: Record<string, unknown> = {
    _page: page,
    _limit: pageSize,
    countId: p.countId,
  };

  if (p.q && p.q.trim()) params.q = p.q.trim();
  if (p.sortBy) {
    params._sort = p.sortBy;
    params._order = p.sortDir ?? "asc";
  }
  if (p.filters) for (const [k, v] of Object.entries(p.filters)) params[k] = v;

  return { params, page, pageSize };
}

/* ---------- Query: linhas da contagem ---------- */
export function useStockCountLines(p: CountLinesParams) {
  const { params, page, pageSize } = buildParams(p);

  return useQuery({
    // inclui os params para o react-query diferenciar páginas/filtros
    queryKey: qk.stockCountLines.byCountList(p.countId, {
      q: p.q,
      page,
      pageSize,
      sortBy: p.sortBy,
      sortDir: p.sortDir,
      filters: p.filters,
    }),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    queryFn: async (): Promise<CountLinesPage> => {
      const res = await api.get<StockCountLineDTO[]>(stockCountLinesPath, {
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

      const items = toStockCountLines(res.data);
      const total =
        Number.isFinite(rawTotal) && rawTotal > 0 ? rawTotal : items.length;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      return { items, page, pageSize, total, pageCount };
    },
  });
}

/* ---------- Mutação: upsert de uma linha (countedQty / delta) ---------- */

export function useUpsertCountLine() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (p: {
      id: Id;
      countId: Id;
      countedQty: number;
      note?: string;
    }) => {
      // 1) buscar a linha atual (para obter expectedQty e note atual)
      const cur = await api.get<StockCountLineDTO>(
        `${stockCountLinesPath}/${p.id}`,
        {
          validateStatus: (s) => s >= 200 && s < 300,
        }
      );
      const curLine = toStockCountLine(cur.data);
      const expected = Number(curLine.expectedQty ?? 0);

      // 2) normalizar e calcular delta
      const counted = Math.max(0, Math.trunc(Number(p.countedQty) || 0));
      const delta = counted - expected;

      // 3) PATCH
      await api.patch(
        `${stockCountLinesPath}/${p.id}`,
        {
          countedQty: counted,
          delta,
          note: p.note ?? curLine.note ?? null,
        },
        { validateStatus: (s) => s >= 200 && s < 300 }
      );

      // 4) devolve a linha atualizada (útil se quiseres otimizar cache)
      return {
        ...curLine,
        countedQty: counted,
        delta,
        note: p.note ?? curLine.note,
      };
    },
    onSuccess: (_v, p) => {
      // invalida a lista dessa contagem (todas as páginas/filtros)
      void qc.invalidateQueries({
        queryKey: qk.stockCountLines.byCount(p.countId),
      });
    },
  });
}
