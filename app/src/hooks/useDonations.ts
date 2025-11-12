// src/hooks/useDonations.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import qk, { type ListParams, type Id } from "@/lib/queryKeys";
import type { Donation, DonationLine } from "@/domain/schemas";
import {
  adaptDonation,
  adaptDonationLine,
  type DonationDTO,
  type DonationLineDTO,
} from "@/adapters/donations";

/* ------------------ Tipos do Create ------------------ */
export interface CreateDonationHead {
  date: string; // YYYY-MM-DD
  donorId: string;
  reference?: string;
  note?: string;
}
export interface CreateDonationLineInput {
  itemId: string;
  quantity: number;
  lot: string;
  expiryDate?: string;
  locationCode?: string;
  note?: string;
}
export interface CreateDonationPayload {
  head: CreateDonationHead;
  lines: ReadonlyArray<CreateDonationLineInput>;
}

/* ---------------------- Queries ---------------------- */
export function useDonations(p?: ListParams & { q?: string }) {
  const params = new URLSearchParams();
  if (p?.q) params.set("q", p.q);
  if (p?.page) params.set("_page", String(p.page));
  if (p?.pageSize) params.set("_limit", String(p.pageSize));
  if (p?.sortBy) params.set("_sort", p.sortBy);
  if (p?.sortDir) params.set("_order", p.sortDir);

  return useQuery({
    queryKey: qk.donations.list(p),
    queryFn: async (): Promise<Donation[]> => {
      const { data } = await api.get<DonationDTO[]>(
        `/donations?${params.toString()}`
      );
      return (data ?? []).map(adaptDonation);
    },
  });
}

export function useDonationDetail(id: Id) {
  return useQuery({
    queryKey: qk.donations.detail(id),
    enabled: !!id,
    queryFn: async (): Promise<Donation> => {
      const { data } = await api.get<DonationDTO>(`/donations/${id}`);
      return adaptDonation(data);
    },
  });
}

export function useDonationLines(donationId: Id) {
  const params = new URLSearchParams({ donationId: String(donationId) });
  return useQuery({
    queryKey: ["donation_lines", donationId],
    enabled: !!donationId,
    queryFn: async (): Promise<DonationLine[]> => {
      const { data } = await api.get<DonationLineDTO[]>(
        `/donation_lines?${params.toString()}`
      );
      return (data ?? []).map(adaptDonationLine);
    },
  });
}

/* ---------------------- Create ----------------------- */
export function useCreateDonation() {
  const qc = useQueryClient();

  // <TData=string, TError=Error, TVariables=CreateDonationPayload>
  return useMutation<string, Error, CreateDonationPayload>({
    mutationFn: async (payload): Promise<string> => {
      // cria cabeçalho
      const headRes = await api.post<DonationDTO>("/donations", {
        date: payload.head.date,
        donorId: payload.head.donorId,
        reference: payload.head.reference ?? null,
        // compat: alguns JSON usam "notes"
        notes: payload.head.note ?? null,
      });

      const created = adaptDonation(headRes.data);
      const donationId = String(created.id); // <- garante string

      // cria linhas
      for (const ln of payload.lines) {
        await api.post<DonationLineDTO>("/donation_lines", {
          donationId,
          itemId: ln.itemId,
          quantity: ln.quantity,
          lot: ln.lot,
          expiryDate: ln.expiryDate ?? null,
          locationCode: ln.locationCode ?? null,
          note: ln.note ?? null,
        });
      }

      return donationId;
    },

    // ok ser async; v5 aceita Promise<void>
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.donations.root }),
        qc.invalidateQueries({ queryKey: ["donation_lines"] }),
      ]);
    },
  });
}
