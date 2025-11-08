import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { AxiosResponseHeaders } from "axios"
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
  birthDate?: string
}

export interface Paged<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
}

export function useBeneficiaries(params: { search?: string; page?: number; limit?: number }) {
  const { search = "", page = 1, limit = 10 } = params

  return useQuery({
    queryKey: qk.beneficiaries({ search, page, limit }),
    queryFn: async (): Promise<Paged<Beneficiary>> => {
      // json-server: paginação via _page/_limit e pesquisa via name_like
      const qs: Record<string, string | number> = { _page: page, _limit: limit }
      if (search) qs["name_like"] = search

      const res = await api.get<Beneficiary[]>("/beneficiaries", { params: qs })

      // Axios v1: headers é AxiosResponseHeaders (tem .get()) e as chaves costumam vir em lowercase
      const h = res.headers as AxiosResponseHeaders
      const totalHeader =
        h.get?.("x-total-count") ??
        // fallback se o adapter não suportar .get():
        (h as unknown as Record<string, string | undefined>)["x-total-count"] ??
        (h as unknown as Record<string, string | undefined>)["X-Total-Count"]

      const total = Number(totalHeader ?? res.data.length)

      return { data: res.data, page, pageSize: limit, total }
    },

    // v5: em vez de keepPreviousData: true
    placeholderData: keepPreviousData,
  })
}
