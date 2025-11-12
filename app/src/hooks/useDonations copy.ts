// src/hooks/useDonations.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import qk, { type ListParams } from "@/lib/queryKeys";
import { api } from "@/lib/api";
import {
  adaptDonation,
  adaptDonations,
  adaptDonationLines,
  toNewDonationDTO,
  toNewDonationLineDTO,
  type NewDonationDTO,
  type NewDonationLineDTO,
  type DonationEx,
  type DonationLineEx,
} from "@/adapters/donations";

/* Query string builder compatível com json-server */
function buildQuery(p?: ListParams): string {
  const qs: string[] = [];
  if (p?.q) qs.push(`q=${encodeURIComponent(p.q)}`);
  if (p?.pageSize) qs.push(`_limit=${p.pageSize}`);
  if (p?.page) qs.push(`_page=${p.page}`);
  if (p?.sortBy) qs.push(`_sort=${encodeURIComponent(p.sortBy)}`);
  if (p?.sortDir) qs.push(`_order=${encodeURIComponent(p.sortDir)}`);
  const filters = p?.filters ?? {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") {
      qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return qs.length ? `?${qs.join("&")}` : "";
}

/* ===================== LIST ===================== */
export function useDonations(params?: ListParams) {
  return useQuery({
    queryKey: qk.donations.list(params),
    queryFn: async (): Promise<DonationEx[]> => {
      const r = await api.get(`/donations${buildQuery(params)}`);
      return adaptDonations(r.data);
    },
  });
}

/* ===================== DETAIL (head) ===================== */
export function useDonationDetail(id: string) {
  return useQuery({
    queryKey: qk.donations.detail(id),
    enabled: !!id,
    queryFn: async (): Promise<DonationEx> => {
      const r = await api.get(`/donations/${encodeURIComponent(id)}`);
      return adaptDonation(r.data);
    },
  });
}

/* ===================== LINES ===================== */
export function useDonationLines(id: string) {
  return useQuery({
    queryKey: ["donation_lines", "donation", id] as const,
    enabled: !!id,
    queryFn: async (): Promise<DonationLineEx[]> => {
      const r = await api.get(
        `/donation_lines?donationId=${encodeURIComponent(id)}`
      );
      return adaptDonationLines(r.data);
    },
  });
}

/* ===================== CREATE (head) ===================== */
export function useCreateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      date: string;
      donorId: string | number;
      reference?: string;
      note?: string;
      donorName?: string;
    }): Promise<DonationEx> => {
      const payload: NewDonationDTO = toNewDonationDTO(input);
      const r = await api.post("/donations", payload);
      return adaptDonation(r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.donations.root });
    },
  });
}

/* ===================== CREATE LINE ===================== */
export function useCreateDonationLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      donationId: string | number;
      itemId: string | number;
      quantity: number;
      lot: string;
      expiryDate?: string;
      locationCode?: string;
      note?: string;
      itemName?: string;
    }): Promise<DonationLineEx> => {
      const payload: NewDonationLineDTO = toNewDonationLineDTO(input);
      const r = await api.post("/donation_lines", payload);
      return adaptDonationLines([r.data])[0];
    },
    onSuccess: (_line, vars) => {
      qc.invalidateQueries({
        queryKey: ["donation_lines", "donation", String(vars.donationId)],
      });
    },
  });
}
