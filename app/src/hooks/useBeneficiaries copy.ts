// src/hooks/useBeneficiaries.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

export interface Beneficiary {
  id: string;
  studentNumber: string;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  curricularYear?: number;
  nif?: string;
  birthDate?: string;
}
export interface Paged<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function useBeneficiaries(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { search = "", page = 1, limit = 10 } = params;

  return useQuery<Paged<Beneficiary>>({
    queryKey: qk.beneficiaries({ search, page, limit }),
    queryFn: async () => {
      const qs: Record<string, string | number> = {
        _page: page,
        _limit: limit,
      };
      if (search.trim()) qs.q = search.trim(); // <— full-text search

      const res = await api.get<Beneficiary[]>("/beneficiaries", {
        params: qs,
      });
      const headers = res.headers as Record<string, string | undefined>;
      const totalHeader = headers["x-total-count"] ?? headers["X-Total-Count"];
      const total = Number(totalHeader ?? res.data.length);

      return { data: res.data, page, pageSize: limit, total };
    },
    placeholderData: (old) => old,
  });
}
