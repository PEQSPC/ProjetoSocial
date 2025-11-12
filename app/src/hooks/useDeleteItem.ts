import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import { itemsPath } from "@/adapters/items";

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: Id }) => {
      await api.delete(`${itemsPath}/${id}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return { id };
    },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: qk.items.root });
      void qc.removeQueries({ queryKey: qk.items.detail(v.id) });
      // Opcional: invalidar lotes desse item
      void qc.invalidateQueries({ queryKey: qk.stockLots.byItem(v.id) });
    },
  });
}
