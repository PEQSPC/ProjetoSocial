// src/hooks/useCreateStockMove.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk from "@/lib/queryKeys";
import { stockMovesPath, toStockMoveDTO } from "@/adapters/stockMoves";
import { recalcItemStock } from "./_recalcItemStock";

export function useCreateStockMove() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof toStockMoveDTO>[0]) => {
      const dto = toStockMoveDTO(input);
      const res = await api.post(stockMovesPath, dto, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      // Recalcular stock do artigo
      await recalcItemStock(input.itemId);
      return res.data;
    },
    onSuccess: (_v, p) => {
      void qc.invalidateQueries({ queryKey: qk.stockMoves.root });
      void qc.invalidateQueries({ queryKey: qk.items.detail(p.itemId) });
      void qc.invalidateQueries({ queryKey: qk.stockLots.byItem(p.itemId) });
      void qc.invalidateQueries({ queryKey: qk.items.root });
    },
  });
}
