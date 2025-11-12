// src/adapters/donations.ts
import { z } from "zod";
import type { Donation, DonationLine } from "@/domain/schemas";

/* ===================== DTOs (API) ===================== */
export const DonationDtoSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    date: z.string(), // yyyy-mm-dd
    donorId: z.union([z.string(), z.number()]),
    reference: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
    notes: z.string().optional().nullable(), // alguns JSONs usam "notes"
    donorName: z.string().optional().nullable(), // conveniência no JSON
  })
  .strict();

export const DonationLineDtoSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    donationId: z.union([z.string(), z.number()]),
    itemId: z.union([z.string(), z.number()]),
    quantity: z.coerce.number(),
    lot: z.string(),
    expiryDate: z.string().optional().nullable(),
    locationCode: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
    itemName: z.string().optional().nullable(), // conveniência no JSON
  })
  .strict();

export type DonationDTO = z.infer<typeof DonationDtoSchema>;
export type DonationLineDTO = z.infer<typeof DonationLineDtoSchema>;

/* Tipos estendidos para a UI (mantêm o domínio + extras opcionais) */
export type DonationEx = Donation & { donorName?: string };
export type DonationLineEx = DonationLine & { itemName?: string };

/* ===================== Adapters ===================== */
export function adaptDonation(dto: unknown): DonationEx {
  const d = DonationDtoSchema.parse(dto);
  return {
    id: String(d.id),
    date: d.date,
    donorId: String(d.donorId),
    reference: d.reference ?? undefined,
    note: d.note ?? d.notes ?? undefined,
    donorName: d.donorName ?? undefined,
  };
}
export function adaptDonations(dtos: unknown): DonationEx[] {
  const arr = Array.isArray(dtos) ? dtos : [];
  return arr.map(adaptDonation);
}

export function adaptDonationLine(dto: unknown): DonationLineEx {
  const d = DonationLineDtoSchema.parse(dto);
  return {
    id: String(d.id),
    donationId: String(d.donationId),
    itemId: String(d.itemId),
    quantity: d.quantity,
    lot: d.lot,
    expiryDate: d.expiryDate ?? undefined,
    locationCode: d.locationCode ?? undefined,
    note: d.note ?? undefined,
    itemName: d.itemName ?? undefined,
  };
}
export function adaptDonationLines(dtos: unknown): DonationLineEx[] {
  const arr = Array.isArray(dtos) ? dtos : [];
  return arr.map(adaptDonationLine);
}

/* ===================== Builders (se usares create) ===================== */
export type NewDonationDTO = Omit<DonationDTO, "id">;
export type NewDonationLineDTO = Omit<DonationLineDTO, "id">;

export function toNewDonationDTO(input: {
  date: string;
  donorId: string | number;
  reference?: string;
  note?: string;
  donorName?: string; // opcional
}): NewDonationDTO {
  return {
    date: input.date,
    donorId: input.donorId,
    reference: input.reference ?? null,
    note: input.note ?? null,
    notes: null,
    donorName: input.donorName ?? null,
  };
}

export function toNewDonationLineDTO(input: {
  donationId: string | number;
  itemId: string | number;
  quantity: number;
  lot: string;
  expiryDate?: string;
  locationCode?: string;
  note?: string;
  itemName?: string; // opcional
}): NewDonationLineDTO {
  return {
    donationId: input.donationId,
    itemId: input.itemId,
    quantity: input.quantity,
    lot: input.lot,
    expiryDate: input.expiryDate ?? null,
    locationCode: input.locationCode ?? null,
    note: input.note ?? null,
    itemName: input.itemName ?? null,
  };
}
