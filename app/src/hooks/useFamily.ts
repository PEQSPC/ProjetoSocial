import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import { familiesPath, toFamily, type FamilyDTO } from "@/adapters/families";
import type { Family } from "@/domain/schemas";

export function useFamily(id: Id, enabled = true) {
  return useQuery({
    queryKey: qk.families.detail(id),
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<Family> => {
      const res = await api.get<FamilyDTO>(`${familiesPath}/${id}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return toFamily(res.data);
    },
  });
}
