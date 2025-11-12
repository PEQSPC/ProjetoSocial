import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import { stockLotsPath } from "@/adapters/stockLots";
import { recalcItemStock } from "./_recalcItemStock";

export function useDeleteStockLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, itemId }: { id: Id; itemId: Id }) => {
      await api.delete(`${stockLotsPath}/${id}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });

      const newSum = await recalcItemStock(itemId);
      return { id, itemId, stockCurrent: newSum };
    },
    onSuccess: (payload) => {
      void qc.invalidateQueries({ queryKey: qk.stockLots.root });
      void qc.invalidateQueries({
        queryKey: qk.stockLots.byItem(payload.itemId),
      });
      void qc.invalidateQueries({ queryKey: qk.items.root });
      void qc.invalidateQueries({ queryKey: qk.items.detail(payload.itemId) });
    },
  });
}
