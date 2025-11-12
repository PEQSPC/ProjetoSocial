// src/hooks/useCreateCountLine.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk, { type Id } from "@/lib/queryKeys";
import { stockCountLinesPath } from "@/adapters/stockCounts";
import type { StockLot, Item } from "@/domain/schemas";

/** Garante um lote sintético "NOLOT" para o item e devolve o seu id */
async function ensureNoLotForItem(itemId: Id): Promise<Id> {
  // 1) procurar se já existe o lote "NOLOT" para este item
  const search = await api.get<StockLot[]>("/stock_lots", {
    params: { itemId, lot: "NOLOT" },
    validateStatus: (s) => s >= 200 && s < 300,
  });

  const found = search.data?.[0];
  if (found) {
    // StockLot["id"] é (string | number) — compatível com Id
    return found.id as Id;
  }

  // 2) ler o item para obter stockCurrent (apenas para semântica do expected)
  const itemRes = await api.get<Item>(`/items/${itemId}`, {
    validateStatus: (s) => s >= 200 && s < 300,
  });
  const stock = Number(itemRes.data?.stockCurrent ?? 0);

  // 3) criar o lote virtual "NOLOT"
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const created = await api.post<StockLot>(
    "/stock_lots",
    {
      itemId,
      lot: "NOLOT",
      quantity: stock,
      remainingQty: stock,
      entryDate: today,
      donorId: null,
      locationCode: itemRes.data?.locationCode ?? undefined,
    },
    { validateStatus: (s) => s >= 200 && s < 300 }
  );

  return created.data.id as Id;
}

/**
 * Cria uma linha de contagem:
 * - Se não vier lotId, cria/garante um lote "NOLOT" e usa-o
 * - Usa o saldo do lote como expectedQty
 */
export function useCreateCountLine() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (p: {
      countId: Id;
      itemId: Id;
      lotId?: Id;
      note?: string;
    }) => {
      let lotId: Id | undefined = p.lotId;

      if (!lotId) {
        lotId = await ensureNoLotForItem(p.itemId);
      }

      // obter saldo do lote -> expected
      const lotRes = await api.get<StockLot>(`/stock_lots/${lotId}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const expected = Number(lotRes.data?.remainingQty ?? 0);

      // criar linha
      const body = {
        countId: p.countId,
        itemId: p.itemId,
        lotId,
        expectedQty: expected,
        countedQty: null as number | null,
        delta: 0,
        note: p.note ?? null,
      };

      await api.post(stockCountLinesPath, body, {
        validateStatus: (s) => s >= 200 && s < 300,
      });

      return body;
    },
    onSuccess: (_v, p) => {
      void qc.invalidateQueries({
        queryKey: qk.stockCountLines.byCount(p.countId),
      });
    },
  });
}
