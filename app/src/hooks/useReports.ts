import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";

/* =============================
   Esquemas base (Zod, sem any)
============================= */

const ItemZ = z.object({
  id: z.string(),
  name: z.string().optional().nullable(),
  familyId: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  stockCurrent: z.number().optional().nullable(),
  // opcional: categoria/tipo se existir nos teus items
});
export type Item = z.infer<typeof ItemZ>;

const StockLotZ = z.object({
  id: z.string(),
  itemId: z.string(),
  lot: z.string().optional().nullable(),
  quantity: z.number().optional().nullable(),
  remainingQty: z.number().default(0),
  expiryDate: z.string().optional().nullable(),
  entryDate: z.string().optional().nullable(),
  locationCode: z.string().optional().nullable(),
});
export type StockLot = z.infer<typeof StockLotZ>;

const DonationZ = z.object({
  id: z.string(),
  donorId: z.string().optional().nullable(),
  donorName: z.string().optional().nullable(),
  date: z.string(),
});
export type Donation = z.infer<typeof DonationZ>;

const DonationLineZ = z.object({
  id: z.string(),
  donationId: z.string(),
  itemId: z.string(),
  itemName: z.string().optional().nullable(),
  lot: z.string().optional().nullable(),
  quantity: z.number(),
  expiryDate: z.string().optional().nullable(),
});
export type DonationLine = z.infer<typeof DonationLineZ>;

const DeliveryZ = z.object({
  id: z.string(),
  beneficiaryId: z.string(),
  beneficiaryName: z.string().optional().nullable(),
  status: z.enum(["NOT_DELIVERED", "DELIVERED", "FAILED"]),
  deliveredAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
});
export type Delivery = z.infer<typeof DeliveryZ>;

const DeliveryLineZ = z.object({
  id: z.string(),
  deliveryId: z.string(),
  itemId: z.string(),
  itemName: z.string().optional().nullable(),
  lot: z.string().optional().nullable(), // pode conter id do lote ou o nome
  quantity: z.number(),
  note: z.string().optional().nullable(),
});
export type DeliveryLine = z.infer<typeof DeliveryLineZ>;

const ScheduleZ = z.object({
  id: z.string(),
  type: z.enum(["DELIVERY", "PICKUP"]),
  status: z.enum(["PLANNED", "CONFIRMED", "DONE", "CANCELLED"]),
  date: z.string(),
  timeSlot: z.string().optional().nullable(),
  beneficiaryId: z.string().optional().nullable(),
  beneficiaryName: z.string().optional().nullable(),
  donorId: z.string().optional().nullable(),
  donorName: z.string().optional().nullable(),
  assignee: z.string().optional().nullable(),
  assigneeName: z.string().optional().nullable(),
});
export type Schedule = z.infer<typeof ScheduleZ>;

const StockMoveZ = z.object({
  id: z.string(),
  itemId: z.string(),
  lotId: z.string().optional().nullable(),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number(),
  createdAt: z.string(),
  reason: z.string().optional().nullable(),
});
export type StockMove = z.infer<typeof StockMoveZ>;

/* =============== Helpers comuns =============== */

function toArraySafe<T>(data: unknown, schema: z.ZodType<T>): T[] {
  const raw = Array.isArray(data) ? data : [];
  // valida individualmente para tolerar registos legacy
  const parsed: T[] = [];
  for (const r of raw) {
    const p = schema.safeParse(r);
    if (p.success) parsed.push(p.data);
  }
  return parsed;
}

async function fetchWithFallback<T>(
  paths: string[],
  params: Record<string, unknown> | undefined,
  schema: z.ZodType<T>
) {
  for (const p of paths) {
    try {
      const res = await api.get(p, { params });
      return toArraySafe(res.data, schema);
    } catch {
      // tenta próxima rota
    }
  }
  return [] as T[];
}

/* =============== Carregadores base =============== */

async function loadItems() {
  return fetchWithFallback<Item>(["/items"], undefined, ItemZ);
}
async function loadLots(itemId?: string, sortExpiry = true) {
  const params = itemId ? { itemId } : undefined;
  const lots = await fetchWithFallback<StockLot>(
    ["/stockLots", "/stock_lots"],
    params,
    StockLotZ
  );
  if (sortExpiry) {
    lots.sort((a, b) => {
      const ax = a.expiryDate
        ? new Date(a.expiryDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bx = b.expiryDate
        ? new Date(b.expiryDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      return ax - bx;
    });
  }
  return lots;
}
async function loadDonations() {
  return fetchWithFallback<Donation>(["/donations"], undefined, DonationZ);
}
async function loadDonationLines() {
  return fetchWithFallback<DonationLine>(
    ["/donation_lines"],
    undefined,
    DonationLineZ
  );
}
async function loadDeliveries(
  status?: "DELIVERED" | "NOT_DELIVERED" | "FAILED"
) {
  const params = status ? { status } : undefined;
  return fetchWithFallback<Delivery>(["/deliveries"], params, DeliveryZ);
}
async function loadDeliveryLines(deliveryId?: string) {
  const params = deliveryId ? { deliveryId } : undefined;
  return fetchWithFallback<DeliveryLine>(
    ["/delivery_lines"],
    params,
    DeliveryLineZ
  );
}
async function loadSchedules() {
  return fetchWithFallback<Schedule>(["/schedules"], undefined, ScheduleZ);
}
async function loadStockMoves() {
  return fetchWithFallback<StockMove>(["/stock_moves"], undefined, StockMoveZ);
}

/* =============== Tipos de filtros =============== */
export type DateRange = { from?: string; to?: string };

function inRange(dIso: string | null | undefined, range?: DateRange) {
  if (!dIso) return true;
  const d = new Date(dIso).getTime();
  if (Number.isNaN(d)) return true;
  if (range?.from) {
    const f = new Date(range.from).getTime();
    if (!Number.isNaN(f) && d < f) return false;
  }
  if (range?.to) {
    const t = new Date(range.to).getTime();
    if (!Number.isNaN(t) && d > t) return false;
  }
  return true;
}

/* =================================================
   1) Relatório: Prioridade por Validade (FEFO)
================================================= */
export type ExpiryBucket = "≤7" | "8–15" | "16–30" | ">30" | "Sem validade";
export interface ExpiryRow {
  itemId: string;
  itemName: string;
  lotId: string;
  lotName: string;
  expiryDate?: string | null;
  daysToExpire: number | null; // null se não tiver validade
  remainingQty: number;
  bucket: ExpiryBucket;
}
export interface ExpiryReport {
  rows: ExpiryRow[];
  totalsByBucket: Record<ExpiryBucket, number>;
  totalQty: number;
}
function toBucket(days: number | null): ExpiryBucket {
  if (days === null) return "Sem validade";
  if (days <= 7) return "≤7";
  if (days <= 15) return "8–15";
  if (days <= 30) return "16–30";
  return ">30";
}

export function useReportExpiryPriority(
  range?: DateRange,
  familyFilter?: string
) {
  return useQuery<ExpiryReport>({
    queryKey: ["reports", "expiry-priority", range, familyFilter],
    queryFn: async () => {
      const [items, lots] = await Promise.all([loadItems(), loadLots()]);
      const itemById = new Map<string, Item>(items.map((i) => [i.id, i]));
      const today = new Date();

      const rows: ExpiryRow[] = lots
        .filter((l) => (l.remainingQty ?? 0) > 0)
        .map((l) => {
          const it = itemById.get(l.itemId);
          const name = it?.name ?? l.itemId;
          const hasExpiry = Boolean(l.expiryDate);
          const diff = hasExpiry
            ? Math.ceil(
                (new Date(l.expiryDate as string).getTime() - today.getTime()) /
                  (24 * 3600 * 1000)
              )
            : null;
          const b = toBucket(diff);

          return {
            itemId: l.itemId,
            itemName: String(name),
            lotId: l.id,
            lotName: l.lot ?? l.id,
            expiryDate: l.expiryDate ?? null,
            daysToExpire: diff,
            remainingQty: l.remainingQty ?? 0,
            bucket: b,
          };
        })
        .filter((r) => {
          if (familyFilter) {
            const item = itemById.get(r.itemId);
            return (item?.familyId ?? "") === familyFilter;
          }
          return true;
        })
        .filter((r) => {
          // aplica intervalo pela validade (se existir)
          if (!r.expiryDate) return true;
          return inRange(r.expiryDate, range);
        })
        .sort((a, b) => {
          const ax =
            a.daysToExpire === null ? Number.MAX_SAFE_INTEGER : a.daysToExpire;
          const bx =
            b.daysToExpire === null ? Number.MAX_SAFE_INTEGER : b.daysToExpire;
          if (ax !== bx) return ax - bx;
          return a.itemName.localeCompare(b.itemName);
        });

      const totals: Record<ExpiryBucket, number> = {
        "≤7": 0,
        "8–15": 0,
        "16–30": 0,
        ">30": 0,
        "Sem validade": 0,
      };
      let totalQty = 0;
      for (const r of rows) {
        totals[r.bucket] += r.remainingQty;
        totalQty += r.remainingQty;
      }

      return { rows, totalsByBucket: totals, totalQty };
    },
    staleTime: 10_000,
  });
}

/* ==========================================
   2) Relatório: Stock Overview (para website)
========================================== */
export interface StockOverviewRow {
  group: string; // Categoria/Família/Tipo (aqui uso familyId como grupo)
  itemId: string;
  itemName: string;
  stockCurrent: number;
}
export interface StockOverviewReport {
  rows: StockOverviewRow[];
  totalsByGroup: Record<string, number>;
  grandTotal: number;
}
export function useReportStockOverview() {
  return useQuery<StockOverviewReport>({
    queryKey: ["reports", "stock-overview"],
    queryFn: async () => {
      const items = await loadItems();
      const rows: StockOverviewRow[] = items.map((i) => ({
        group: i.familyId ?? "—",
        itemId: i.id,
        itemName: i.name ?? i.id,
        stockCurrent: i.stockCurrent ?? 0,
      }));
      const totals: Record<string, number> = {};
      let grand = 0;
      for (const r of rows) {
        totals[r.group] = (totals[r.group] ?? 0) + r.stockCurrent;
        grand += r.stockCurrent;
      }
      return { rows, totalsByGroup: totals, grandTotal: grand };
    },
    staleTime: 10_000,
  });
}

/* =====================================
   3) Relatório: Movimentos de Stock
===================================== */
export interface StockMovesReportRow {
  date: string;
  type: "IN" | "OUT";
  itemId: string;
  itemName: string;
  lotId?: string | null;
  quantity: number;
  reason?: string | null;
}
export function useReportStockMoves(range?: DateRange) {
  return useQuery<StockMovesReportRow[]>({
    queryKey: ["reports", "stock-moves", range],
    queryFn: async () => {
      const [moves, items] = await Promise.all([loadStockMoves(), loadItems()]);
      const itemById = new Map<string, Item>(items.map((i) => [i.id, i]));
      return moves
        .filter((m) => inRange(m.createdAt, range))
        .map<StockMovesReportRow>((m) => ({
          date: m.createdAt,
          type: m.type,
          itemId: m.itemId,
          itemName: itemById.get(m.itemId)?.name ?? m.itemId,
          lotId: m.lotId ?? null,
          quantity: m.quantity,
          reason: m.reason ?? null,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    },
  });
}

/* =======================================================
   4) Relatório: Doações por doador
======================================================= */
export interface DonationsByDonorRow {
  donor: string;
  donationsCount: number;
  totalQuantity: number;
  distinctItems: number;
}
export function useReportDonationsByDonor(range?: DateRange) {
  return useQuery<DonationsByDonorRow[]>({
    queryKey: ["reports", "donations-by-donor", range],
    queryFn: async () => {
      const [donations, lines] = await Promise.all([
        loadDonations(),
        loadDonationLines(),
      ]);

      const linesByDonation = new Map<string, DonationLine[]>();
      for (const ln of lines) {
        const arr = linesByDonation.get(ln.donationId) ?? [];
        arr.push(ln);
        linesByDonation.set(ln.donationId, arr);
      }

      const agg = new Map<string, DonationsByDonorRow>();
      for (const d of donations) {
        if (!inRange(d.date, range)) continue;
        const key = d.donorName ?? d.donorId ?? "—";
        const ds = agg.get(key) ?? {
          donor: key,
          donationsCount: 0,
          totalQuantity: 0,
          distinctItems: 0,
        };

        ds.donationsCount += 1;
        const lns = linesByDonation.get(d.id) ?? [];
        ds.totalQuantity += lns.reduce((acc, l) => acc + (l.quantity ?? 0), 0);
        ds.distinctItems += new Set(lns.map((l) => l.itemId)).size;

        agg.set(key, ds);
      }
      return Array.from(agg.values()).sort(
        (a, b) => b.totalQuantity - a.totalQuantity
      );
    },
  });
}

/* =======================================================
   5) Relatório: Entregas por beneficiário
======================================================= */
export interface DeliveriesByBeneficiaryRow {
  beneficiary: string;
  deliveriesCount: number;
  totalQuantity: number;
}
export function useReportDeliveriesByBeneficiary(range?: DateRange) {
  return useQuery<DeliveriesByBeneficiaryRow[]>({
    queryKey: ["reports", "deliveries-by-beneficiary", range],
    queryFn: async () => {
      const [deliveries, lines] = await Promise.all([
        loadDeliveries(),
        loadDeliveryLines(),
      ]);

      const linesByDelivery = new Map<string, DeliveryLine[]>();
      for (const ln of lines) {
        const arr = linesByDelivery.get(ln.deliveryId) ?? [];
        arr.push(ln);
        linesByDelivery.set(ln.deliveryId, arr);
      }

      const agg = new Map<string, DeliveriesByBeneficiaryRow>();
      for (const d of deliveries) {
        if (d.status !== "DELIVERED") continue;
        const created = d.deliveredAt ?? d.createdAt ?? null;
        if (!inRange(created, range)) continue;

        const key = d.beneficiaryName ?? d.beneficiaryId;
        const row = agg.get(key) ?? {
          beneficiary: key,
          deliveriesCount: 0,
          totalQuantity: 0,
        };
        row.deliveriesCount += 1;

        const lns = linesByDelivery.get(d.id) ?? [];
        row.totalQuantity += lns.reduce((acc, l) => acc + (l.quantity ?? 0), 0);

        agg.set(key, row);
      }
      return Array.from(agg.values()).sort(
        (a, b) => b.deliveriesCount - a.deliveriesCount
      );
    },
  });
}

/* =======================================================
   6) Relatório: Cumprimento de Agendamentos
======================================================= */
export interface SchedulesComplianceRow {
  date: string;
  planned: number;
  confirmed: number;
  done: number;
  cancelled: number;
}
export function useReportSchedulesCompliance(range?: DateRange) {
  return useQuery<SchedulesComplianceRow[]>({
    queryKey: ["reports", "schedules-compliance", range],
    queryFn: async () => {
      const scheds = await loadSchedules();
      const byDate = new Map<string, SchedulesComplianceRow>();
      for (const s of scheds) {
        if (!inRange(s.date, range)) continue;
        const key = s.date;
        const row = byDate.get(key) ?? {
          date: key,
          planned: 0,
          confirmed: 0,
          done: 0,
          cancelled: 0,
        };
        if (s.status === "PLANNED") row.planned += 1;
        else if (s.status === "CONFIRMED") row.confirmed += 1;
        else if (s.status === "DONE") row.done += 1;
        else row.cancelled += 1;
        byDate.set(key, row);
      }
      return Array.from(byDate.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    },
  });
}

/* =======================================================
   7) Relatório: Qualidade de Dados
======================================================= */
export interface DataQualityReport {
  itemsWithoutName: number;
  itemsWithoutStockCurrent: number;
  lotsWithoutExpiryFood: number; // se precisares, adapta por categoria
  lotsWithNegativeRemaining: number;
  deliveriesWithoutLines: number;
  totals: Record<string, number>;
}
export function useReportDataQuality() {
  return useQuery<DataQualityReport>({
    queryKey: ["reports", "data-quality"],
    queryFn: async () => {
      const [items, lots, deliveries, dlines] = await Promise.all([
        loadItems(),
        loadLots(undefined, false),
        loadDeliveries(),
        loadDeliveryLines(),
      ]);

      const itemsWithoutName = items.filter(
        (i) => !i.name || !String(i.name).trim()
      ).length;
      const itemsWithoutStockCurrent = items.filter(
        (i) => typeof i.stockCurrent !== "number"
      ).length;
      const lotsWithoutExpiryFood = lots.filter((l) => !l.expiryDate).length; // se quiseres filtrar por tipo=FOOD, ajusta
      const lotsWithNegativeRemaining = lots.filter(
        (l) => (l.remainingQty ?? 0) < 0
      ).length;

      const linesByDelivery = new Map<string, number>();
      for (const ln of dlines) {
        linesByDelivery.set(
          ln.deliveryId,
          (linesByDelivery.get(ln.deliveryId) ?? 0) + 1
        );
      }
      const deliveriesWithoutLines = deliveries.filter(
        (d) => (linesByDelivery.get(d.id) ?? 0) === 0
      ).length;

      const totals: Record<string, number> = {
        itemsWithoutName,
        itemsWithoutStockCurrent,
        lotsWithoutExpiryFood,
        lotsWithNegativeRemaining,
        deliveriesWithoutLines,
      };
      return {
        itemsWithoutName,
        itemsWithoutStockCurrent,
        lotsWithoutExpiryFood,
        lotsWithNegativeRemaining,
        deliveriesWithoutLines,
        totals,
      };
    },
  });
}
