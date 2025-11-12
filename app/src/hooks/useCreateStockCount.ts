// src/hooks/useCreateStockCount.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk from "@/lib/queryKeys";
import {
  stockCountsPath,
  toStockCountDTO,
  type StockCountDTO,
} from "@/adapters/stockCounts";
import { toStockCount } from "@/adapters/stockCounts";

export function useCreateStockCount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      input,
    }: {
      input: Parameters<typeof toStockCountDTO>[0];
    }) => {
      const dto = toStockCountDTO(input);
      const res = await api.post<StockCountDTO>(stockCountsPath, dto, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return toStockCount(res.data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.stockCounts.root });
    },
  });
}
