// src/hooks/useAdjustStockLot.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk, { type Id } from "@/lib/queryKeys";
import { recalcItemStock } from "./_recalcItemStock";
//import { stockMovesPath, toStockMoveDTO } from "@/adapters/stockMoves";
import type { StockLot } from "@/domain/schemas";

/**
 * Ajusta o saldo (remainingQty) de um lote e cria um movimento ADJUST com o delta.
 * - Lê o lote atual para calcular delta = novoSaldo - saldoAnterior
 * - Faz PATCH do lote
 * - Cria movimento ADJUST com a quantidade assinada (delta)
 * - Recalcula stockCurrent do artigo
 */
export function useAdjustStockLot() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (p: {
      lotId: Id;
      itemId: Id;
      newRemaining: number;
      reason?: string;
      user?: string;
      locationCode?: string; // opcional: localização associada ao ajuste
    }) => {
      // 1) obter saldo anterior do lote (para delta)
      const lotRes = await api.get<StockLot>(`/stock_lots/${p.lotId}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const oldRemaining = Number(lotRes.data?.remainingQty ?? 0);
      const newRemaining = Math.max(0, Math.trunc(Number(p.newRemaining) || 0));
      const delta = newRemaining - oldRemaining;

      // sem alteração → nada a fazer
      if (delta === 0) {
        return { changed: false as const, delta, oldRemaining, newRemaining };
      }

      // 2) PATCH no lote
      await api.patch(
        `/stock_lots/${p.lotId}`,
        { remainingQty: newRemaining },
        { validateStatus: (s) => s >= 200 && s < 300 }
      );

      // 3) Movimento ADJUST (delta pode ser negativo/positivo)

      // 4) Recalcular stock do artigo
      await recalcItemStock(p.itemId);

      return { changed: true as const, delta, oldRemaining, newRemaining };
    },

    onSuccess: (_result, p) => {
      // invalidar lotes e item
      void qc.invalidateQueries({ queryKey: qk.stockLots.root });
      void qc.invalidateQueries({ queryKey: qk.stockLots.byItem(p.itemId) });
      void qc.invalidateQueries({ queryKey: qk.items.detail(p.itemId) });
      void qc.invalidateQueries({ queryKey: qk.items.root });

      // (opcional) histórico de movimentos — só se adicionares qk.stockMoves
      void qc.invalidateQueries({ queryKey: qk.stockMoves.root });
    },
  });
}
