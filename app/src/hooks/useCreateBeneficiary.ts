// src/hooks/useCreateBeneficiary.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Beneficiary } from "./useBeneficiaries"
import type { BeneficiaryInput } from "@/domain/schemas"

export function useCreateBeneficiary() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BeneficiaryInput) => {
      const res = await api.post<Beneficiary>("/beneficiaries", {
        studentNumber: payload.studentNumber,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        course: payload.course,
        curricularYear: payload.curricularYear,
        nif: payload.nif,             // ✅ inclui NIF
        birthDate: payload.birthDate, // ✅ inclui Data Nasc. (YYYY-MM-DD)
        createdAt: new Date().toISOString(),
      })
      return res.data
    },
    onSuccess: () => {
      // 🔁 revalidar QUALQUER lista de beneficiários (independentemente do search/página)
      qc.invalidateQueries({ queryKey: ["beneficiaries"] })
    },
  })
}
