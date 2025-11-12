import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Beneficiary {
  id: string;
  studentNumber: string;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  curricularYear?: number;
  nif?: string;
  birthDate?: string; // YYYY-MM-DD
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
  const term = search.trim();

  return useQuery<Paged<Beneficiary>>({
    queryKey: ["beneficiaries", { term, page, limit }],
    queryFn: async () => {
      // 1) sem pesquisa -> paginação no servidor
      if (!term) {
        const res = await api.get<Beneficiary[]>("/beneficiaries", {
          params: { _page: page, _limit: limit },
        });
        const headers = res.headers as Record<
          string,
          string | number | undefined
        >;
        const totalHeader = (headers["x-total-count"] ??
          headers["X-Total-Count"]) as string | number | undefined;
        const total = Number(totalHeader ?? res.data.length);
        return { data: res.data, page, pageSize: limit, total };
      }

      // 2) com pesquisa -> tenta q (server) e pagina no cliente (fallback garantido)
      const res = await api.get<Beneficiary[]>("/beneficiaries", {
        params: { q: term },
      });
      const all = res.data;

      // (Opcional) filtro extra no cliente para ser “contém” em campos relevantes
      const needle = term.toLocaleLowerCase("pt-PT");
      const filtered = all.filter((b) => {
        const hay = [b.name, b.email, b.studentNumber, b.nif, b.course, b.phone]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-PT");
        return hay.includes(needle);
      });

      const total = filtered.length;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);
      return { data, page, pageSize: limit, total };
    },
    placeholderData: (old) => old,
  });
}
