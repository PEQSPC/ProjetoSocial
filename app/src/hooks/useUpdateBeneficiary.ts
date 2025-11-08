import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Beneficiary } from "./useBeneficiaries";

export type BeneficiaryUpdate = Partial<Omit<Beneficiary, "id">>;

/**
 * Atualiza um beneficiário (PATCH) e invalida a lista e o detalhe.
 */
export function useUpdateBeneficiary(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BeneficiaryUpdate) => {
      const res = await api.patch<Beneficiary>(`/beneficiaries/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beneficiaries"] });
      qc.invalidateQueries({ queryKey: ["beneficiary", id] });
    },
  });
}
