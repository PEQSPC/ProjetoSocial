import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk, type Id } from "@/lib/queryKeys";
import { itemsPath, toItem, type ItemDTO } from "@/adapters/items";
import type { Item } from "@/domain/schemas";

export function useItem(id: Id, enabled = true) {
  return useQuery({
    queryKey: qk.items.detail(id),
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<Item> => {
      const res = await api.get<ItemDTO>(`${itemsPath}/${id}`, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return toItem(res.data);
    },
  });
}
