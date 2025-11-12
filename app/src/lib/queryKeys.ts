// src/lib/queryKeys.ts

/** Id genérico para entidades (string ou number). */
export type Id = string | number;

/** Parâmetros comuns para listagens. */
export type ListParams = Readonly<{
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  /** Filtros específicos por ecrã (ex.: { familyId: "..." }) */
  filters?: Readonly<Record<string, unknown>>;
}>;

/**
 * Padrão:
 * - qk.<entity>.root         -> ["entity"]
 * - qk.<entity>.list(p?)     -> ["entity"] | ["entity", params]
 * - qk.<entity>.detail(id)   -> ["entity", id]
 */
export const qk = {
  /* --------------------- Beneficiários --------------------- */
  beneficiaries: {
    root: ["beneficiaries"] as const,
    list: (p?: ListParams) =>
      p ? (["beneficiaries", p] as const) : (["beneficiaries"] as const),
    detail: (id: Id) => ["beneficiaries", id] as const,
  },

  /* ----------------------- Famílias ------------------------ */
  families: {
    root: ["families"] as const,
    list: (p?: ListParams) =>
      p ? (["families", p] as const) : (["families"] as const),
    detail: (id: Id) => ["families", id] as const,
  },

  /* ------------------------ Doadores ----------------------- */
  donors: {
    root: ["donors"] as const,
    list: (p?: ListParams) =>
      p ? (["donors", p] as const) : (["donors"] as const),
    detail: (id: Id) => ["donors", id] as const,
  },

  /* -------------------------- Items ------------------------ */
  items: {
    root: ["items"] as const,
    list: (p?: ListParams) =>
      p ? (["items", p] as const) : (["items"] as const),
    detail: (id: Id) => ["items", id] as const,
  },

  /* ----------------------- Stock Lots ---------------------- */
  stockLots: {
    root: ["stock_lots"] as const,
    list: (p?: ListParams) =>
      p ? (["stock_lots", p] as const) : (["stock_lots"] as const),
    detail: (id: Id) => ["stock_lots", id] as const,

    /** Chave base por item (para invalidar tudo de um item) */
    byItem: (itemId: Id) => ["stock_lots", "item", itemId] as const,

    /** Lista por item + params (para paginação/ordenação) */
    byItemList: (itemId: Id, p?: ListParams) =>
      p
        ? (["stock_lots", "item", itemId, p] as const)
        : (["stock_lots", "item", itemId] as const),
  },

  /* ------------------------ Inventário --------------------- */
  inventory: {
    root: ["inventory"] as const,
    list: (p?: ListParams) =>
      p ? (["inventory", p] as const) : (["inventory"] as const),
    detail: (id: Id) => ["inventory", id] as const,
  },

  /* ---------------------- Stock Moves ---------------------- */
  stockMoves: {
    root: ["stock_moves"] as const,
    list: (p?: ListParams) =>
      p ? (["stock_moves", p] as const) : (["stock_moves"] as const),
    detail: (id: Id) => ["stock_moves", id] as const,
  },

  /* ---------------------- Stock Counts --------------------- */
  stockCounts: {
    root: ["stock_counts"] as const,
    list: (p?: ListParams) =>
      p ? (["stock_counts", p] as const) : (["stock_counts"] as const),
    detail: (id: Id) => ["stock_counts", id] as const,
  },

  /* ------------------- Stock Count Lines ------------------- */
  stockCountLines: {
    root: ["stock_count_lines"] as const,
    list: (p?: ListParams) =>
      p
        ? (["stock_count_lines", p] as const)
        : (["stock_count_lines"] as const),
    byCount: (countId: Id) => ["stock_count_lines", "count", countId] as const,
    byCountList: (countId: Id, p?: ListParams) =>
      p
        ? (["stock_count_lines", "count", countId, p] as const)
        : (["stock_count_lines", "count", countId] as const),
    detail: (id: Id) => ["stock_count_lines", id] as const,
  },

  /* ------------------------- Doações ----------------------- */
  donations: {
    root: ["donations"] as const,
    list: (p?: ListParams) =>
      p ? (["donations", p] as const) : (["donations"] as const),
    detail: (id: Id) => ["donations", id] as const,
  },

  /* --------------------- Linhas de Doação ------------------ */
  donationLines: {
    root: ["donation_lines"] as const,
    list: (p?: ListParams) =>
      p ? (["donation_lines", p] as const) : (["donation_lines"] as const),
    byDonation: (donationId: Id) =>
      ["donation_lines", "donation", donationId] as const,
    byDonationList: (donationId: Id, p?: ListParams) =>
      p
        ? (["donation_lines", "donation", donationId, p] as const)
        : (["donation_lines", "donation", donationId] as const),
    detail: (id: Id) => ["donation_lines", id] as const,
  },

  /* ----------------------- Agendamentos -------------------- */
  schedules: {
    root: ["schedules"] as const,
    list: (p?: ListParams) =>
      p ? (["schedules", p] as const) : (["schedules"] as const),
    detail: (id: Id) => ["schedules", id] as const,
  },

  /* ------------------------- Entregas ---------------------- */
  deliveries: {
    root: ["deliveries"] as const,
    list: (p?: ListParams) =>
      p ? (["deliveries", p] as const) : (["deliveries"] as const),
    detail: (id: Id) => ["deliveries", id] as const,
  },

  /* ------------------------- Relatórios -------------------- */
  reports: {
    root: ["reports"] as const,
    list: (p?: ListParams) =>
      p ? (["reports", p] as const) : (["reports"] as const),
  },
} as const;

export default qk;
