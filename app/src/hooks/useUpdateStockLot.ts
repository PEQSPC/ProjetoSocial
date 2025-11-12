import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import {
  stockLotsPath,
  toStockLotPatch,
  toStockLot,
  type StockLotDTO,
} from "@/adapters/stockLots";
import { recalcItemStock } from "./_recalcItemStock";

export function useUpdateStockLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      itemId,
      patch,
    }: {
      id: Id;
      itemId: Id;
      patch: Parameters<typeof toStockLotPatch>[0];
    }) => {
      const p = toStockLotPatch(patch);
      const res = await api.patch<StockLotDTO>(`${stockLotsPath}/${id}`, p, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const lot = toStockLot(res.data);

      await recalcItemStock(itemId);

      return lot;
    },
    onSuccess: (lot) => {
      void qc.invalidateQueries({ queryKey: qk.stockLots.root });
      void qc.invalidateQueries({ queryKey: qk.stockLots.byItem(lot.itemId) });
      void qc.invalidateQueries({ queryKey: qk.items.root });
      void qc.invalidateQueries({ queryKey: qk.items.detail(lot.itemId) });
    },
  });
}
