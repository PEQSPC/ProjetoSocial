import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { qk } from "@/lib/queryKeys"
import { beneficiarySchema } from "@/domain/schemas"

export function useUpdateBeneficiary(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: unknown) => {
      const payload = beneficiarySchema.partial().parse(input) // campos parciais
      const { data } = await api.patch(`/beneficiaries/${id}`, {
        ...payload,
        updatedAt: new Date().toISOString(),
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.beneficiaries() })
      qc.invalidateQueries({ queryKey: [...qk.beneficiaries(), id] })
    },
  })
}
