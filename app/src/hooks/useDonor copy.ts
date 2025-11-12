import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import { donorsPath, toDonor, type DonorDTO } from "@/adapters/donors";
import type { Donor } from "@/domain/schemas";

export function useDonor(id: Id, enabled = true) {
  return useQuery({
    queryKey: qk.donors.detail(id),
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<Donor> => {
      const res = await api.get<DonorDTO>(`${donorsPath}/${id}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return toDonor(res.data);
    },
  });
}
