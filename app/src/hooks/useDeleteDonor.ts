import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import { donorsPath } from "@/adapters/donors";

export function useDeleteDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: Id }) => {
      await api.delete(`${donorsPath}/${id}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return { id };
    },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: qk.donors.root });
      void qc.removeQueries({ queryKey: qk.donors.detail(v.id) });
    },
  });
}
