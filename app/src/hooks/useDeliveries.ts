import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  adaptDelivery,
  type Delivery,
  type DeliveryDTO,
  type DeliveryStatus,
} from "@/adapters/deliveries";
import {
  adaptDeliveryLine,
  type DeliveryLine,
  type DeliveryLineDTO,
} from "@/adapters/deliveryLines";
import { planFefoDeduction, type StockLot } from "@/lib/fefo";

/* ---------- Tipos ---------- */
export type DeliveryListParams = {
  page?: number;
  pageSize?: number;
  status?: DeliveryStatus;
  /** YYYY-MM-DD */
  dateFrom?: string;
  /** YYYY-MM-DD */
  dateTo?: string;
  q?: string;
};

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export const qk = {
  deliveries: (params?: DeliveryListParams) =>
    ["deliveries", "list", params ?? {}] as const,
  delivery: (id: string) => ["deliveries", "detail", id] as const,
  deliveryLines: (deliveryId: string) =>
    ["deliveries", "lines", deliveryId] as const,
  items: () => ["items"] as const,
  stockLots: (itemId?: string) => ["stockLots", itemId ?? "all"] as const,
  schedules: (id?: string) => ["schedules", id ?? null] as const,
};

/* ---------- Listagem (paginada + filtros) ---------- */
export function useDeliveries(params: DeliveryListParams = {}) {
  const { page = 1, pageSize = 10, status, dateFrom, dateTo, q } = params;

  const httpParams: Record<string, unknown> = { _page: page, _limit: pageSize };
  if (q && q.trim()) httpParams.q = q.trim(); // <-- pesquisa livre
  if (status) httpParams.status = status;
  if (dateFrom) httpParams.createdAt_gte = dateFrom;
  if (dateTo) httpParams.createdAt_lte = `${dateTo}T23:59:59.999Z`;

  return useQuery<Paged<Delivery>>({
    queryKey: qk.deliveries({ ...params, page, pageSize }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      // Construir parâmetros só com o que interessa ao json-server
      const httpParams: Record<string, string | number> = {
        _page: page,
        _limit: pageSize,
        _sort: "createdAt",
        _order: "desc",
      };
      if (params.status) httpParams.status = params.status;
      if (params.dateFrom) httpParams.createdAt_gte = params.dateFrom;
      if (params.dateTo) httpParams.createdAt_lte = params.dateTo;

      const res = await api.get<DeliveryDTO[]>("/deliveries", {
        params: httpParams,
        validateStatus: (s) => s >= 200 && s < 300,
      });

      const items = (Array.isArray(res.data) ? res.data : []).map(
        adaptDelivery
      );

      // json-server devolve X-Total-Count quando há paginação
      const rawTotal = (res.headers["x-total-count"] ??
        res.headers["X-Total-Count"]) as string | number | undefined;
      const total = Number(rawTotal ?? items.length);

      return { items, page, pageSize, total };
    },
  });
}

/* ---------- Detalhe ---------- */
export function useDeliveryDetail(id: string) {
  return useQuery<Delivery>({
    queryKey: qk.delivery(id),
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<DeliveryDTO>(`/deliveries/${id}`);
      return adaptDelivery(res.data);
    },
  });
}

/* ---------- Linhas ---------- */
export function useDeliveryLines(deliveryId: string) {
  return useQuery<DeliveryLine[]>({
    queryKey: qk.deliveryLines(deliveryId),
    enabled: !!deliveryId,
    queryFn: async () => {
      const res = await api.get<DeliveryLineDTO[]>(`/delivery_lines`, {
        params: { deliveryId },
      });
      const arr = Array.isArray(res.data) ? res.data : [];
      return arr.map((x) => adaptDeliveryLine(x));
    },
  });
}

/* ---------- Criar entrega (rascunho) ---------- */
export function useCreateDelivery() {
  const qc = useQueryClient();

  type CreateDeliveryInput = {
    delivery: Omit<
      Delivery,
      "id" | "createdAt" | "updatedAt" | "deliveredAt"
    > & {
      deliveredAt?: string | null;
    };
    lines: Array<Omit<DeliveryLine, "id" | "deliveryId">>;
  };

  return useMutation<Delivery, unknown, CreateDeliveryInput>({
    mutationFn: async (payload) => {
      const now = new Date().toISOString();
      const deliveryRes = await api.post("/deliveries", {
        ...payload.delivery,
        status: payload.delivery.status ?? "NOT_DELIVERED",
        deliveredAt: payload.delivery.deliveredAt ?? null,
        createdAt: now,
        updatedAt: now,
      });

      const delivery = adaptDelivery(deliveryRes.data as DeliveryDTO);

      for (const ln of payload.lines) {
        await api.post("/delivery_lines", { ...ln, deliveryId: delivery.id });
      }

      return delivery;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.deliveries({}) });
    },
  });
}

/* ---------- Confirmar entrega (dedução FEFO) ---------- */
export function useConfirmDelivery() {
  const qc = useQueryClient();

  type ConfirmArgs = {
    delivery: Delivery;
    lines: DeliveryLine[];
    scheduleId?: string | null;
  };

  return useMutation<{ ok: true }, unknown, ConfirmArgs>({
    mutationFn: async ({ delivery, lines, scheduleId }) => {
      const lotsByItem = new Map<string, StockLot[]>();

      for (const line of lines) {
        if (!lotsByItem.has(line.itemId)) {
          const lotsRes = await api.get<StockLot[]>("/stockLots", {
            params: { itemId: line.itemId },
          });
          const lotsArr = Array.isArray(lotsRes.data) ? lotsRes.data : [];
          lotsByItem.set(line.itemId, lotsArr);
        }
        const lots = lotsByItem.get(line.itemId)!;
        const picks = planFefoDeduction(
          lots,
          line.quantity,
          line.lot ?? undefined
        );
        for (const p of picks) {
          const lot = lots.find((l) => l.id === p.lotId)!;
          lot.remainingQty -= p.qty;
        }
      }

      for (const [itemId, lots] of lotsByItem.entries()) {
        for (const lot of lots) {
          if (lot.remainingQty < 0) throw new Error("remainingQty negativo!");
          await api.patch(`/stockLots/${lot.id}`, {
            remainingQty: lot.remainingQty,
          });
        }
        const fresh = await api.get<StockLot[]>("/stockLots", {
          params: { itemId },
        });
        const stockCurrent = (fresh.data ?? []).reduce(
          (acc, l) => acc + (l.remainingQty ?? 0),
          0
        );
        await api.patch(`/items/${itemId}`, { stockCurrent });
      }

      const now = new Date().toISOString();
      await api.patch(`/deliveries/${delivery.id}`, {
        status: "DELIVERED",
        deliveredAt: now,
        updatedAt: now,
      });

      if (scheduleId) {
        await api.patch(`/schedules/${scheduleId}`, {
          status: "DONE",
          deliveryId: delivery.id,
          updatedAt: now,
        });
      }

      return { ok: true };
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
