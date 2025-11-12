import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import {
  familiesPath,
  toFamilyPatch,
  toFamily,
  type FamilyDTO,
} from "@/adapters/families";
import type { FamilyInput } from "@/domain/schemas";

interface UpdateFamilyVariables {
  id: Id;
  patch: Partial<FamilyInput>;
}

export function useUpdateFamily() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: UpdateFamilyVariables) => {
      const dtoPatch = toFamilyPatch(patch);
      const res = await api.patch<FamilyDTO>(
        `${familiesPath}/${id}`,
        dtoPatch,
        {
          validateStatus: (s) => s >= 200 && s < 300,
        }
      );
      return toFamily(res.data);
    },
    onSuccess: (_data, variables) => {
      // refresca lista e detalhe
      qc.invalidateQueries({ queryKey: qk.families.root });
      qc.invalidateQueries({ queryKey: qk.families.detail(variables.id) });
    },
  });
}
