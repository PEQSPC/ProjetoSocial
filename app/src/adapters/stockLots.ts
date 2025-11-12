import {
  stockLotSchema,
  stockLotInputSchema,
  type StockLot,
  type StockLotInput,
} from "@/domain/schemas";

/** Endpoint para a coleção no json-server */
export const stockLotsPath = "/stock_lots";

export interface StockLotDTO {
  id: string | number;
  itemId: string | number;
  lot: string;
  quantity: number; // quantidade de entrada
  remainingQty: number; // saldo atual do lote
  entryDate: string; // YYYY-MM-DD
  expiryDate?: string | null; // YYYY-MM-DD
  donorId?: string | number | null;
}

export type NewStockLotDTO = Omit<StockLotDTO, "id">;

const trimOrUndef = (v?: string | null) => {
  if (v == null) return undefined;
  const t = String(v).trim();
  return t ? t : undefined;
};

/** DTO -> Domínio */
export function toStockLot(dto: StockLotDTO): StockLot {
  return stockLotSchema.parse({
    id: dto.id,
    itemId: dto.itemId,
    lot: dto.lot,
    quantity: Number(dto.quantity),
    remainingQty: Number(dto.remainingQty),
    entryDate: dto.entryDate,
    expiryDate: dto.expiryDate ?? undefined,
    donorId: dto.donorId ?? undefined,
  });
}

export function toStockLots(dtos: ReadonlyArray<StockLotDTO>): StockLot[] {
  return dtos.map(toStockLot);
}

/** Domínio -> DTO (Create) */
export function toStockLotDTO(input: StockLotInput): NewStockLotDTO {
  const v = stockLotInputSchema.parse(input);
  return {
    itemId: v.itemId,
    lot: v.lot,
    quantity: v.quantity,
    remainingQty: v.remainingQty,
    entryDate: v.entryDate,
    expiryDate: v.expiryDate ?? undefined,
    donorId: v.donorId ?? undefined,
  };
}

/** Domínio parcial -> DTO (Patch) */
export function toStockLotPatch(
  partial: Partial<StockLotInput>
): Partial<NewStockLotDTO> {
  const v = stockLotInputSchema.partial().parse(partial);
  return {
    ...(v.itemId !== undefined ? { itemId: v.itemId } : {}),
    ...(v.lot !== undefined ? { lot: v.lot } : {}),
    ...(v.quantity !== undefined ? { quantity: v.quantity } : {}),
    ...(v.remainingQty !== undefined ? { remainingQty: v.remainingQty } : {}),
    ...(v.entryDate !== undefined ? { entryDate: v.entryDate } : {}),
    ...(v.expiryDate !== undefined
      ? { expiryDate: trimOrUndef(v.expiryDate ?? undefined) }
      : {}),
    ...(v.donorId !== undefined ? { donorId: v.donorId ?? undefined } : {}),
  };
}
