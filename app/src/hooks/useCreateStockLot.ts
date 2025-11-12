import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk from "@/lib/queryKeys";
import {
  stockLotsPath,
  toStockLotDTO,
  toStockLot,
  type StockLotDTO,
} from "@/adapters/stockLots";
import { recalcItemStock } from "./_recalcItemStock";

export function useCreateStockLot() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      input,
    }: {
      input: Parameters<typeof toStockLotDTO>[0];
    }) => {
      const dto = toStockLotDTO(input);
      const res = await api.post<StockLotDTO>(stockLotsPath, dto, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const lot = toStockLot(res.data);

      // Recalcular stock do artigo (server-side denormalizado)
      await recalcItemStock(lot.itemId);

      return lot;
    },
    onSuccess: (lot) => {
      // invalidar lista geral e por item
      void qc.invalidateQueries({ queryKey: qk.stockLots.root });
      void qc.invalidateQueries({ queryKey: qk.stockLots.byItem(lot.itemId) });
      // invalidar item (lista e detalhe)
      void qc.invalidateQueries({ queryKey: qk.items.root });
      void qc.invalidateQueries({ queryKey: qk.items.detail(lot.itemId) });
    },
  });
}
