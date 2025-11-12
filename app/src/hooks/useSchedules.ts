// src/hooks/useSchedules.ts
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  schedulesPath,
  toSchedule,
  toSchedules,
  type Schedule,
  type ScheduleDTO,
  type ScheduleStatus,
  type ScheduleType,
} from "@/adapters/schedules";

/* =============================
 * Tipos
 * ============================= */
export type SchedulesListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
};

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

/* =============================
 * Query Keys
 * ============================= */
export const qk = {
  list: (p?: SchedulesListParams) => ["schedules", "list", p] as const,
  detail: (id: string) => ["schedules", "detail", id] as const,
};

/* =============================
 * Lista (paginada)
 * ============================= */
export function useSchedules(p?: SchedulesListParams) {
  const page = Math.max(1, p?.page ?? 1);
  const pageSize = Math.max(1, p?.pageSize ?? 15);

  const params: Record<string, unknown> = { _page: page, _limit: pageSize };
  if (p?.q && p.q.trim()) params.q = p.q.trim();
  if (p?.type) params.type = p.type;
  if (p?.status) params.status = p.status;
  if (p?.dateFrom) params.date_gte = p.dateFrom;
  if (p?.dateTo) params.date_lte = p.dateTo;

  return useQuery<Paged<Schedule>>({
    queryKey: qk.list({ ...p, page, pageSize }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await api.get<ScheduleDTO[]>(schedulesPath, { params });
      const items = toSchedules(res.data);
      const totalHeader = res.headers["x-total-count"];
      const total =
        typeof totalHeader === "string"
          ? parseInt(totalHeader, 10)
          : Number(totalHeader ?? items.length);
      return { items, page, pageSize, total };
    },
  });
}

/* =============================
 * Detalhe
 * ============================= */
export function useScheduleDetail(id: string) {
  return useQuery<Schedule>({
    queryKey: qk.detail(id),
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<ScheduleDTO>(`${schedulesPath}/${id}`);
      return toSchedule(res.data);
    },
  });
}

/* =============================
 * Criar / Atualizar estado
 * ============================= */
type CreateInput = Omit<
  Schedule,
  "id" | "createdAt" | "updatedAt" | "deliveryId" | "donationId"
> & {
  deliveryId?: string | null;
  donationId?: string | null;
};

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation<Schedule, unknown, CreateInput>({
    mutationFn: async (input) => {
      const now = new Date().toISOString();
      const res = await api.post<ScheduleDTO>(schedulesPath, {
        ...input,
        createdAt: now,
        updatedAt: now,
      });
      return toSchedule(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation<
    Schedule,
    unknown,
    { id: string; patch: Partial<Schedule> }
  >({
    mutationFn: async ({ id, patch }) => {
      const now = new Date().toISOString();
      const res = await api.patch<ScheduleDTO>(`${schedulesPath}/${id}`, {
        ...patch,
        updatedAt: now,
      });
      return toSchedule(res.data);
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: qk.detail(id) });
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

/* Ações rápidas */
export function useConfirmSchedule() {
  const upd = useUpdateSchedule();
  return {
    ...upd,
    mutate: (id: string) => upd.mutate({ id, patch: { status: "CONFIRMED" } }),
  } as const;
}

export function useMarkDoneSchedule() {
  const upd = useUpdateSchedule();
  return {
    ...upd,
    mutate: (
      id: string,
      link?: { deliveryId?: string | null; donationId?: string | null }
    ) => upd.mutate({ id, patch: { status: "DONE", ...(link ?? {}) } }),
  } as const;
}

export function useCancelSchedule() {
  const upd = useUpdateSchedule();
  return {
    ...upd,
    mutate: (id: string) => upd.mutate({ id, patch: { status: "CANCELLED" } }),
  } as const;
}
