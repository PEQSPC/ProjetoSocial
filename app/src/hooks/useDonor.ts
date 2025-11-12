// src/hooks/useDonor.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import { donorSchema, type Donor } from "@/domain/schemas";

export function useDonor(id: Id, enabled: boolean = true) {
  return useQuery({
    queryKey: qk.donors.detail(id),
    enabled,
    queryFn: async (): Promise<Donor> => {
      const res = await api.get(`/donors/${id}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      // valida o payload com zod (segurança extra)
      return donorSchema.parse(res.data);
    },
  });
}
