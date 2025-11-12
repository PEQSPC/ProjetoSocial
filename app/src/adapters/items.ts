// src/adapters/items.ts
import {
  itemSchema,
  itemInputSchema,
  type Item,
  type ItemInput,
  unitSchema,
  type Unit,
} from "@/domain/schemas";

/** Endpoint para a coleção no json-server */
export const itemsPath = "/items";

/** DTO tal como guardado/recebido no json-server */
export interface ItemDTO {
  id: string | number;
  sku: string;
  name: string;
  familyId: string | number;
  unit: Unit; // "KG" | "UNIT" | "PACK" | "L"
  minStock?: number | null;
  eanCodes?: string[] | null;
  stockCurrent?: number | null; // denormalizado (soma dos remainingQty dos lotes)
  notes?: string | null;
  createdAt?: string; // YYYY-MM-DD
  updatedAt?: string; // YYYY-MM-DD

  /** NOVO: código/localização da prateleira */
  locationCode?: string | null;
}

export type NewItemDTO = Omit<ItemDTO, "id">;

const trimOrUndef = (v?: string | null) => {
  if (v == null) return undefined;
  const t = String(v).trim();
  return t ? t : undefined;
};

function normalizeEANs(v?: string[] | null): string[] | undefined {
  if (!v || v.length === 0) return undefined;
  const arr = v.map((s) => String(s).trim()).filter(Boolean);
  return arr.length > 0 ? arr : undefined;
}

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** DTO -> Domínio */
export function toItem(dto: ItemDTO): Item {
  const normalized: Item = itemSchema.parse({
    id: dto.id,
    sku: String(dto.sku),
    name: dto.name,
    familyId:
      typeof dto.familyId === "number" ? dto.familyId : String(dto.familyId),
    unit: unitSchema.parse(dto.unit),
    minStock: typeof dto.minStock === "number" ? dto.minStock : 0,
    eanCodes: normalizeEANs(dto.eanCodes),
    stockCurrent:
      typeof dto.stockCurrent === "number" ? dto.stockCurrent : undefined,
    notes: trimOrUndef(dto.notes),
    createdAt: dto.createdAt ?? todayYMD(),
    updatedAt: dto.updatedAt ?? todayYMD(),

    // NOVO
    locationCode: trimOrUndef(dto.locationCode),
  });
  return normalized;
}

export function toItems(dtos: ReadonlyArray<ItemDTO>): Item[] {
  return dtos.map(toItem);
}

/** Domínio -> DTO (Create) */
export function toItemDTO(
  input: ItemInput,
  today: string = todayYMD()
): NewItemDTO {
  const v = itemInputSchema.parse(input);
  return {
    sku: v.sku,
    name: v.name,
    familyId: v.familyId,
    unit: v.unit,
    minStock: v.minStock ?? 0,
    eanCodes: normalizeEANs(v.eanCodes) ?? [],
    stockCurrent: typeof v.stockCurrent === "number" ? v.stockCurrent : 0,
    notes: trimOrUndef(v.notes),
    createdAt: today,
    updatedAt: today,

    // NOVO
    locationCode: trimOrUndef(v.locationCode),
  };
}

/** Domínio parcial -> DTO (Patch) */
export function toItemPatch(
  partial: Partial<ItemInput>,
  today: string = todayYMD()
): Partial<NewItemDTO> {
  const v = itemInputSchema.partial().parse(partial);
  return {
    ...(v.sku !== undefined ? { sku: v.sku } : {}),
    ...(v.name !== undefined ? { name: v.name } : {}),
    ...(v.familyId !== undefined ? { familyId: v.familyId } : {}),
    ...(v.unit !== undefined ? { unit: v.unit } : {}),
    ...(v.minStock !== undefined ? { minStock: v.minStock ?? 0 } : {}),
    ...(v.eanCodes !== undefined
      ? { eanCodes: normalizeEANs(v.eanCodes) ?? [] }
      : {}),
    ...(v.stockCurrent !== undefined
      ? { stockCurrent: v.stockCurrent ?? 0 }
      : {}),
    ...(v.notes !== undefined ? { notes: trimOrUndef(v.notes) } : {}),
    ...(v.locationCode !== undefined
      ? { locationCode: trimOrUndef(v.locationCode) }
      : {}), // NOVO
    updatedAt: today,
  };
}

/** Helper: recalcula o stockCurrent a partir dos lotes (soma dos remainingQty) */
export function computeStockCurrentFromLots(
  remainingQtyList: number[]
): number {
  return remainingQtyList.reduce(
    (acc, n) => acc + (Number.isFinite(n) ? Number(n) : 0),
    0
  );
}
