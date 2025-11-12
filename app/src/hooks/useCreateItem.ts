import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { itemsPath, toItemDTO, toItem, type ItemDTO } from "@/adapters/items";

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
    }: {
      input: Parameters<typeof toItemDTO>[0];
    }) => {
      const dto = toItemDTO(input);
      const res = await api.post<ItemDTO>(itemsPath, dto, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return toItem(res.data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.items.root });
    },
  });
}
