import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { qk } from "@/lib/queryKeys"

export interface Beneficiary {
  id: string
  studentNumber: string
  name: string
  email: string
  phone?: string
  course?: string
  curricularYear?: number
  nif?: string
  birthDate?: string // YYYY-MM-DD
}

export interface Paged<T> { data: T[]; page: number; pageSize: number; total: number }

export function useBeneficiaries(params: { search?: string; page?: number; limit?: number }) {
  const { search = "", page = 1, limit = 10 } = params

  return useQuery<Paged<Beneficiary>>({
    queryKey: qk.beneficiaries({ search, page, limit }),
    queryFn: async () => {
      // json-server full-text search:
      // - "q" pesquisa em todas as props
      // - _page / _limit paginam
      const qs: Record<string, string | number> = { _page: page, _limit: limit }
      if (search.trim()) qs["q"] = search.trim()

      const res = await api.get<Beneficiary[]>("/beneficiaries", { params: qs })
      const headers = res.headers as Record<string, string | number | undefined>
      const totalHeader = (headers["x-total-count"] ?? headers["X-Total-Count"]) as string | number | undefined
      const total = Number(totalHeader ?? res.data.length)

      return { data: res.data, page, pageSize: limit, total }
    },
    placeholderData: old => old,
  })
}
