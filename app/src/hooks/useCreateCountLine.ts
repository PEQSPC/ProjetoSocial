import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk, { type Id } from "@/lib/queryKeys";
import { stockCountLinesPath } from "@/adapters/stockCounts";
import { stockLotsPath } from "@/adapters/stockLots";
import type { StockLot } from "@/domain/schemas";

/** Input com e sem lote (permitimos omitir lotId) */
type CreateLineInputWithLot = {
  countId: Id;
  itemId: Id;
  lotId: Id;
  note?: string;
};
type CreateLineInputNoLot = {
  countId: Id;
  itemId: Id;
  note?: string;
};
export type CreateLineInput = CreateLineInputWithLot | CreateLineInputNoLot;

/** Garante que existe um lote "NOLOT" para o item e devolve o id */
async function ensureNoLotLot(itemId: Id): Promise<Id> {
  // 1) tentar encontrar
  const res = await api.get<StockLot[]>(stockLotsPath, {
    params: { itemId, lot: "NOLOT", _limit: 1 },
    validateStatus: (s) => s >= 200 && s < 300,
  });
  if (Array.isArray(res.data) && res.data.length > 0) {
    return res.data[0].id as Id;
  }

  // 2) criar caso não exista
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const entryDate = `${yyyy}-${mm}-${dd}`;

  const create = await api.post<StockLot>(
    stockLotsPath,
    {
      itemId,
      lot: "NOLOT",
      quantity: 0,
      remainingQty: 0,
      entryDate,
      donorId: null,
    },
    { validateStatus: (s) => s >= 200 && s < 300 }
  );

  return create.data.id as Id;
}

export function useCreateCountLine() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (p: CreateLineInput) => {
      // escolher o lote: usa o passado ou cria/garante NOLOT
      const lotId: Id =
        "lotId" in p && p.lotId !== undefined
          ? p.lotId
          : await ensureNoLotLot(p.itemId);

      // linha inicial: expected=saldo do lote (se quiseres, podes recalcular noutro lado)
      const lotRes = await api.get<StockLot>(`${stockLotsPath}/${lotId}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const expectedQty = Number(lotRes.data?.remainingQty ?? 0);

      const body = {
        countId: p.countId,
        itemId: p.itemId,
        lotId,
        expectedQty,
        countedQty: 0,
        delta: -expectedQty,
        note: p.note ?? null,
      };

      const r = await api.post(stockCountLinesPath, body, {
        validateStatus: (s) => s >= 200 && s < 300,
      });

      return r.data;
    },

    onSuccess: (_v, p) => {
      // invalida as linhas desta contagem
      void qc.invalidateQueries({
        queryKey: qk.stockCountLines.byCount(p.countId),
      });
    },
  });
}
