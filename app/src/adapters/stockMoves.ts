// src/adapters/stockMoves.ts
import type { Id } from "@/lib/queryKeys";
import {
  stockMoveSchema,
  stockMoveInputSchema,
  stockMoveTypeSchema,
  type StockMove,
  type StockMoveInput,
} from "@/domain/schemas";

export const stockMovesPath = "/stock_moves";

/* ===== DTOs ===== */
export interface StockMoveDTO {
  id: Id;
  itemId: Id;
  lotId: Id;
  type: "IN" | "OUT" | "ADJUST" | "TRANSFER";
  quantity: number; // pode ser negativo em ADJUST
  reason?: string | null;
  docRef?: string | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  createdAt?: string | null; // ISO
  user?: string | null;
}
export type NewStockMoveDTO = Omit<StockMoveDTO, "id">;

const nowISO = () => new Date().toISOString();

/* ===== DTO -> Domínio ===== */
export function toStockMove(dto: StockMoveDTO): StockMove {
  return stockMoveSchema.parse({
    id: dto.id,
    itemId: dto.itemId,
    lotId: dto.lotId,
    type: stockMoveTypeSchema.parse(dto.type),
    quantity: Number(dto.quantity), // mantém sinal
    reason: dto.reason ?? undefined,
    docRef: dto.docRef ?? undefined,
    fromLocation: dto.fromLocation ?? undefined,
    toLocation: dto.toLocation ?? undefined,
    createdAt: dto.createdAt ?? nowISO(),
    user: dto.user ?? undefined,
  });
}

export function toStockMoves(dtos: ReadonlyArray<StockMoveDTO>): StockMove[] {
  return dtos.map(toStockMove);
}

/* ===== Domínio -> DTO ===== */
export function toStockMoveDTO(input: StockMoveInput): NewStockMoveDTO {
  // valida conforme schema (já permite negativos em ADJUST)
  const v = stockMoveInputSchema.parse(input);
  return {
    itemId: v.itemId,
    lotId: v.lotId,
    type: stockMoveTypeSchema.parse(v.type),
    quantity: Number(v.quantity), // mantém sinal
    reason: v.reason ?? null,
    docRef: v.docRef ?? null,
    fromLocation: v.fromLocation ?? null,
    toLocation: v.toLocation ?? null,
    createdAt: v.createdAt ?? nowISO(),
    user: v.user ?? null,
  };
}
