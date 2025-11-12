import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import {
  donorsPath,
  toDonorPatch,
  toDonor,
  type DonorDTO,
} from "@/adapters/donors";

export function useUpdateDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: Id;
      patch: Parameters<typeof toDonorPatch>[0];
    }) => {
      const p = toDonorPatch(patch);
      const res = await api.patch<DonorDTO>(`${donorsPath}/${id}`, p, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return toDonor(res.data);
    },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: qk.donors.root });
      void qc.invalidateQueries({ queryKey: qk.donors.detail(v.id) });
    },
  });
}
