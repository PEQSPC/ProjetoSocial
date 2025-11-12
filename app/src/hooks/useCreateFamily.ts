import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import {
  familiesPath,
  toFamilyDTO,
  toFamily,
  type FamilyDTO,
} from "@/adapters/families";
import type { FamilyInput } from "@/domain/schemas";

interface CreateFamilyVariables {
  input: FamilyInput;
}

export function useCreateFamily() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ input }: CreateFamilyVariables) => {
      const dto = toFamilyDTO(input);
      const res = await api.post<FamilyDTO>(familiesPath, dto, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return toFamily(res.data);
    },
    onSuccess: () => {
      // refresca listas
      qc.invalidateQueries({ queryKey: qk.families.root });
    },
  });
}
