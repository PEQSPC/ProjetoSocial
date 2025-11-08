import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Beneficiary } from "./useBeneficiaries";

/**
 * Lê um beneficiário pelo id.
 * Usa uma queryKey simples ["beneficiary", id] para não depender de qk.
 */
export function useBeneficiary(id?: string) {
  const enabled = Boolean(id);

  return useQuery<Beneficiary>({
    queryKey: ["beneficiary", id],
    enabled,
    queryFn: async () => {
      const res = await api.get<Beneficiary>(`/beneficiaries/${id}`);
      return res.data;
    },
    staleTime: 60_000, // 1 min
  });
}
