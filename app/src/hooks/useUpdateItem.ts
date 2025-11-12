import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import { itemsPath, toItemPatch, toItem, type ItemDTO } from "@/adapters/items";

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: Id;
      patch: Parameters<typeof toItemPatch>[0];
    }) => {
      const p = toItemPatch(patch);
      const res = await api.patch<ItemDTO>(`${itemsPath}/${id}`, p, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return toItem(res.data);
    },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: qk.items.root });
      void qc.invalidateQueries({ queryKey: qk.items.detail(v.id) });
    },
  });
}
