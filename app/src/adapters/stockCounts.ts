// src/adapters/stockCounts.ts
import type { Id } from "@/lib/queryKeys";
import {
  stockCountSchema,
  stockCountInputSchema,
  type StockCount,
  type StockCountInput,
  stockCountLineSchema,
  stockCountLineInputSchema,
  type StockCountLine,
  type StockCountLineInput,
  stockCountStatusSchema,
} from "@/domain/schemas";

export const stockCountsPath = "/stock_counts";
export const stockCountLinesPath = "/stock_count_lines";

/* ==============================
 *           DTOs
 * ==============================*/

export interface StockCountDTO {
  id: Id;
  name: string;
  status: "OPEN" | "CLOSED";
  createdAt?: string | null; // ISO
  closedAt?: string | null; // ISO | null
  filters?: Record<string, unknown> | null;
}
export type NewStockCountDTO = Omit<StockCountDTO, "id">;

export interface StockCountLineDTO {
  id: Id;
  countId: Id;
  itemId: Id;
  lotId: Id;
  expectedQty: number;
  countedQty?: number | null;
  delta?: number | null; // counted - expected (pode ser calculado)
  note?: string | null;
}
export type NewStockCountLineDTO = Omit<StockCountLineDTO, "id">;

/* ==============================
 *      Helpers internos
 * ==============================*/

const nowISO = () => new Date().toISOString();

/* ==============================
 *        DTO -> Domínio
 * ==============================*/

export function toStockCount(dto: StockCountDTO): StockCount {
  // valida e normaliza via zod (status, datas, etc.)
  return stockCountSchema.parse({
    id: dto.id,
    name: dto.name,
    status: stockCountStatusSchema.parse(dto.status),
    createdAt: dto.createdAt ?? nowISO(),
    closedAt: dto.closedAt ?? null,
    filters: dto.filters ?? undefined,
  });
}

export function toStockCounts(
  dtos: ReadonlyArray<StockCountDTO>
): StockCount[] {
  return dtos.map(toStockCount);
}

export function toStockCountLine(dto: StockCountLineDTO): StockCountLine {
  // Se delta vier ausente no DTO, zod aceita opcional; se vier, mantém.
  return stockCountLineSchema.parse({
    id: dto.id,
    countId: dto.countId,
    itemId: dto.itemId,
    lotId: dto.lotId,
    expectedQty: dto.expectedQty,
    countedQty: dto.countedQty ?? undefined,
    delta: dto.delta ?? undefined,
    note: dto.note ?? undefined,
  });
}

export function toStockCountLines(
  dtos: ReadonlyArray<StockCountLineDTO>
): StockCountLine[] {
  return dtos.map(toStockCountLine);
}

/* ==============================
 *        Domínio -> DTO
 * ==============================*/

export function toStockCountDTO(input: StockCountInput): NewStockCountDTO {
  const v = stockCountInputSchema.parse(input);
  return {
    name: v.name,
    status: stockCountStatusSchema.parse(v.status ?? "OPEN"),
    createdAt: v.createdAt ?? nowISO(),
    closedAt: v.closedAt ?? null,
    filters: v.filters ?? null,
  };
}

export function toStockCountLineDTO(
  input: StockCountLineInput
): NewStockCountLineDTO {
  const v = stockCountLineInputSchema.parse(input);
  const delta =
    typeof v.countedQty === "number" ? v.countedQty - v.expectedQty : null;

  return {
    countId: v.countId,
    itemId: v.itemId,
    lotId: v.lotId,
    expectedQty: v.expectedQty,
    countedQty: v.countedQty ?? null,
    delta,
    note: v.note ?? null,
  };
}
