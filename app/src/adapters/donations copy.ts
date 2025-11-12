import { z } from "zod";
import type { Donation, DonationLine } from "@/domain/schemas";

const DonationDtoSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    date: z.string(),
    donorId: z.union([z.string(), z.number()]),
    reference: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
    notes: z.string().optional().nullable(), // <— aceita notes (plural)
  })
  .strict();

const DonationLineDtoSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    donationId: z.union([z.string(), z.number()]),
    itemId: z.union([z.string(), z.number()]),
    quantity: z.coerce.number(),
    lot: z.string(),
    expiryDate: z.string().optional().nullable(),
    locationCode: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
  })
  .strict();

type DonationDTO = z.infer<typeof DonationDtoSchema>;
type DonationLineDTO = z.infer<typeof DonationLineDtoSchema>;

export function adaptDonation(dto: unknown): Donation {
  const d: DonationDTO = DonationDtoSchema.parse(dto);
  return {
    id: String(d.id),
    date: d.date,
    donorId: String(d.donorId),
    reference: d.reference ?? undefined,
    note: d.note ?? d.notes ?? undefined, // <— mapeia notes -> note
  };
}

export function adaptDonationLine(dto: unknown): DonationLine {
  const d: DonationLineDTO = DonationLineDtoSchema.parse(dto);
  return {
    id: String(d.id),
    donationId: String(d.donationId),
    itemId: String(d.itemId),
    quantity: d.quantity,
    lot: d.lot,
    expiryDate: d.expiryDate ?? undefined,
    locationCode: d.locationCode ?? undefined,
    note: d.note ?? undefined,
  };
}
