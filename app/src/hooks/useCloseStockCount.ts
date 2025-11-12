// src/hooks/useCloseStockCount.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk, { type Id } from "@/lib/queryKeys";
import { stockCountsPath } from "@/adapters/stockCounts";

export function useCloseStockCount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: Id }) => {
      const closedAt = new Date().toISOString();
      await api.patch(
        `${stockCountsPath}/${id}`,
        {
          status: "CLOSED",
          closedAt,
        },
        { validateStatus: (s) => s >= 200 && s < 300 }
      );
      return { id, closedAt };
    },
    onSuccess: (_v, p) => {
      // invalida lista e o detalhe desta contagem
      void qc.invalidateQueries({ queryKey: qk.stockCounts.root });
      void qc.invalidateQueries({ queryKey: qk.stockCounts.detail(p.id) });
    },
  });
}
