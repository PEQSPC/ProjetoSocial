import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import {
  donorsPath,
  toDonorDTO,
  toDonor,
  type DonorDTO,
} from "@/adapters/donors";

export function useCreateDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
    }: {
      input: Parameters<typeof toDonorDTO>[0];
    }) => {
      const dto = toDonorDTO(input);
      const res = await api.post<DonorDTO>(donorsPath, dto, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return toDonor(res.data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.donors.root });
    },
  });
}
