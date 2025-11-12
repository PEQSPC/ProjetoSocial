import {
  donorSchema,
  donorInputSchema,
  type Donor,
  type DonorInput,
} from "@/domain/schemas";

export const donorsPath = "/donors";

export interface DonorDTO {
  id: string | number;
  type: "COMPANY" | "PRIVATE";
  name: string;
  email?: string | null;
  nif?: string | null;
  address?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  createdAt?: string; // YYYY-MM-DD
  updatedAt?: string; // YYYY-MM-DD
}

export type NewDonorDTO = Omit<DonorDTO, "id">;

const trimOrUndef = (v?: string | null) => {
  if (v == null) return undefined;
  const t = String(v).trim();
  return t ? t : undefined;
};

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* DTO -> Domínio */
export function toDonor(dto: DonorDTO): Donor {
  const normalized = {
    id: dto.id,
    type: dto.type,
    name: dto.name,
    email: trimOrUndef(dto.email),
    nif: trimOrUndef(dto.nif),
    address: trimOrUndef(dto.address),
    postalCode: trimOrUndef(dto.postalCode),
    notes: trimOrUndef(dto.notes),
    createdAt: dto.createdAt ?? todayYMD(),
    updatedAt: dto.updatedAt ?? todayYMD(),
  };
  return donorSchema.parse(normalized);
}

export function toDonors(dtos: ReadonlyArray<DonorDTO>): Donor[] {
  return dtos.map(toDonor);
}

/* Domínio -> DTO (Create/Update) */
export function toDonorDTO(
  input: DonorInput,
  today: string = todayYMD()
): NewDonorDTO {
  const v = donorInputSchema.parse(input);
  return {
    type: v.type,
    name: v.name,
    email: trimOrUndef(v.email),
    nif: trimOrUndef(v.nif),
    address: trimOrUndef(v.address),
    postalCode: trimOrUndef(v.postalCode),
    notes: trimOrUndef(v.notes),
    createdAt: today,
    updatedAt: today,
  };
}

export function toDonorPatch(
  partial: Partial<DonorInput>,
  today: string = todayYMD()
): Partial<NewDonorDTO> {
  const v = donorInputSchema.partial().parse(partial);
  return {
    ...(v.type !== undefined ? { type: v.type } : {}),
    ...(v.name !== undefined ? { name: v.name } : {}),
    ...(v.email !== undefined ? { email: trimOrUndef(v.email) } : {}),
    ...(v.nif !== undefined ? { nif: trimOrUndef(v.nif) } : {}),
    ...(v.address !== undefined ? { address: trimOrUndef(v.address) } : {}),
    ...(v.postalCode !== undefined
      ? { postalCode: trimOrUndef(v.postalCode) }
      : {}),
    ...(v.notes !== undefined ? { notes: trimOrUndef(v.notes) } : {}),
    updatedAt: today,
  };
}
