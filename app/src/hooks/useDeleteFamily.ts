import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import { familiesPath } from "@/adapters/families";

interface DeleteFamilyVariables {
  id: Id;
}

export function useDeleteFamily() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteFamilyVariables) => {
      await api.delete(`${familiesPath}/${id}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return { id };
    },
    onSuccess: (_data, variables) => {
      // limpa caches relevantes
      qc.invalidateQueries({ queryKey: qk.families.root });
      qc.removeQueries({ queryKey: qk.families.detail(variables.id) });
    },
  });
}
