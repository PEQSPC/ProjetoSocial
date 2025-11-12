// src/adapters/families.ts
import {
  familySchema,
  familyInputSchema,
  type Family,
  type FamilyInput,
} from "@/domain/schemas";

/** Endpoint base no mock/api */
export const familiesPath = "/families";

/** DTO exatamente como vem/do vai para a API. */
export interface FamilyDTO {
  id: string; // UUID string
  name: string;
  notes?: string; // pode vir "", normalizamos para undefined
  createdAt: string; // "YYYY-MM-DD"
  updatedAt: string; // "YYYY-MM-DD"
}

/** Para criação (sem id) — o json-server atribui id */
export type NewFamilyDTO = Omit<FamilyDTO, "id">;

/* ---------------- Normalizadores simples ---------------- */
const trimOrUndef = (v?: string | null): string | undefined => {
  if (v == null) return undefined;
  const t = String(v).trim();
  return t.length ? t : undefined;
};

/* ---------------- DTO -> Domínio ---------------- */
export function toFamily(dto: FamilyDTO): Family {
  const normalized = {
    id: dto.id,
    name: dto.name,
    notes: trimOrUndef(dto.notes),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
  return familySchema.parse(normalized);
}

export function toFamilies(dtos: ReadonlyArray<FamilyDTO>): Family[] {
  return dtos.map(toFamily);
}

/* ---------------- Domínio -> DTO (Create/Update) ---------------- */
export function toFamilyDTO(
  input: FamilyInput,
  today: string = todayYMD()
): NewFamilyDTO {
  const valid = familyInputSchema.parse(input);
  return {
    name: valid.name,
    notes: trimOrUndef(valid.notes),
    createdAt: today,
    updatedAt: today,
  };
}

export function toFamilyPatch(
  partial: Partial<FamilyInput>,
  today: string = todayYMD()
): Partial<NewFamilyDTO> {
  const valid = familyInputSchema.partial().parse(partial);
  const patch: Partial<NewFamilyDTO> = {
    ...(valid.name !== undefined ? { name: valid.name } : {}),
    ...(valid.notes !== undefined ? { notes: trimOrUndef(valid.notes) } : {}),
    updatedAt: today,
  };
  return patch;
}

/* ---------------- Utils ---------------- */
function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
