import { api } from "@/lib/api";

/**
 * Recalcula o stockCurrent do artigo com base na soma dos remainingQty
 * dos lotes associados (json-server).
 */
export async function recalcItemStock(itemId: string | number): Promise<void> {
  // 1) Obter lotes do artigo
  const lotsRes = await api.get(`/stock_lots`, {
    params: { itemId },
    validateStatus: (s) => s >= 200 && s < 300,
  });

  const lots: Array<{ remainingQty?: number }> = Array.isArray(lotsRes.data)
    ? lotsRes.data
    : [];

  const stockCurrent = lots.reduce(
    (acc, l) => acc + (Number(l.remainingQty) || 0),
    0
  );

  // 2) Atualizar o artigo com a soma
  await api.patch(
    `/items/${itemId}`,
    { stockCurrent },
    {
      validateStatus: (s) => s >= 200 && s < 300,
    }
  );
}
