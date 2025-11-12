import { z } from "zod";
import { api } from "@/lib/api";

/** Tipos de domínio (mínimos usados nestas páginas) */
export type Donation = {
  id: string;
  date: string; // yyyy-mm-dd
  donorId: string;
  donorName?: string; // denormalizado (opcional)
  reference?: string;
  note?: string;
};

export type DonationLine = {
  id: string;
  donationId: string;
  itemId: string;
  itemName?: string; // denormalizado (opcional)
  quantity: number;
  lot?: string;
  expiryDate?: string;
  locationCode?: string;
  note?: string;
};

/* -------- DTOs vindos do json-server -------- */
const DonationDto = z
  .object({
    id: z.union([z.string(), z.number()]),
    date: z.string(),
    donorId: z.union([z.string(), z.number()]),
    donorName: z.string().optional().nullable(),
    reference: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
    notes: z.string().optional().nullable(), // alguns registos podem trazer "notes"
  })
  .strict();

const DonationLineDto = z
  .object({
    id: z.union([z.string(), z.number()]),
    donationId: z.union([z.string(), z.number()]),
    itemId: z.union([z.string(), z.number()]),
    itemName: z.string().optional().nullable(),
    quantity: z.coerce.number(),
    lot: z.string().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    locationCode: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
  })
  .strict();

type DonationDTO = z.infer<typeof DonationDto>;
type DonationLineDTO = z.infer<typeof DonationLineDto>;

export const donationsPath = "/donations";
export const donationLinesPath = "/donation_lines";

/* -------- Adapters -------- */
export function adaptDonation(dtoUnknown: unknown): Donation {
  const d: DonationDTO = DonationDto.parse(dtoUnknown);
  return {
    id: String(d.id),
    date: d.date,
    donorId: String(d.donorId),
    donorName: d.donorName ?? undefined,
    reference: d.reference ?? undefined,
    note: d.note ?? d.notes ?? undefined,
  };
}

export function adaptDonationLine(dtoUnknown: unknown): DonationLine {
  const l: DonationLineDTO = DonationLineDto.parse(dtoUnknown);
  return {
    id: String(l.id),
    donationId: String(l.donationId),
    itemId: String(l.itemId),
    itemName: l.itemName ?? undefined,
    quantity: l.quantity,
    lot: l.lot ?? undefined,
    expiryDate: l.expiryDate ?? undefined,
    locationCode: l.locationCode ?? undefined,
    note: l.note ?? undefined,
  };
}

/* -------- API helpers usados pelas páginas -------- */
export async function fetchDonations(
  params?: Record<string, unknown>
): Promise<Donation[]> {
  const res = await api.get<unknown[]>(donationsPath, { params });
  return (res.data ?? []).map(adaptDonation);
}

export async function fetchDonation(id: string): Promise<Donation> {
  const res = await api.get<unknown>(`${donationsPath}/${id}`);
  return adaptDonation(res.data);
}

export async function fetchDonationLines(
  donationId: string
): Promise<DonationLine[]> {
  const res = await api.get<unknown[]>(donationLinesPath, {
    params: { donationId },
  });
  return (res.data ?? []).map(adaptDonationLine);
}
