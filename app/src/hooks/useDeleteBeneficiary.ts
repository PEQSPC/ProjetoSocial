import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { qk } from "@/lib/queryKeys"

export function useDeleteBeneficiary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/beneficiaries/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.beneficiaries() })
    },
  })
}
