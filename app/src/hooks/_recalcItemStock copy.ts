// src/hooks/_recalcItemStock.ts
import { api } from "@/lib/api";
import { computeStockCurrentFromLots } from "@/adapters/items";
import type { Id } from "@/lib/queryKeys";
import type { StockLotDTO } from "@/adapters/stockLots";

/** Lê lotes do item, soma remainingQty e faz PATCH no item com stockCurrent */
export async function recalcItemStock(itemId: Id) {
  // 1) Ler lotes do item
  const lotsRes = await api.get<StockLotDTO[]>("/stock_lots", {
    params: { itemId },
    validateStatus: (s) => s >= 200 && s < 300,
  });
  const sum = computeStockCurrentFromLots(
    lotsRes.data.map((l) => l.remainingQty ?? 0)
  );

  // 2) Atualizar item
  await api.patch(
    `/items/${itemId}`,
    { stockCurrent: sum },
    { validateStatus: (s) => s >= 200 && s < 300 }
  );

  return sum;
}
