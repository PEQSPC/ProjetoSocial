import { z } from "zod";
import { api } from "@/lib/api";

const StockLotDtoSchema = z
  .object({
    remainingQty: z.coerce.number().optional(),
  })
  .passthrough();
const StockLotListSchema = z.array(StockLotDtoSchema);

/** Soma remainingQty dos lotes de um item e atualiza item.stockCurrent */
export async function recalcItemStock(itemId: string) {
  const lotsRes = await api.get(
    `/stock_lots?itemId=${encodeURIComponent(itemId)}`
  );
  const lots = StockLotListSchema.parse(lotsRes.data ?? []);
  const total = lots.reduce((acc, l) => acc + (l.remainingQty ?? 0), 0);
  await api.patch(`/items/${encodeURIComponent(itemId)}`, {
    stockCurrent: total,
  });
}
