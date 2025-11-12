// src/domain/schemas.ts
import { z } from "zod";

/* ---------------- Regras comuns ---------------- */
const nifRegex = /^[0-9]{9}$/;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

/* =================================================
 *                 BENEFICIÁRIOS
 * ===============================================*/
export const beneficiarySchema = z.object({
  studentNumber: z.string().min(1, "Obrigatório"),
  name: z.string().min(1, "Obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  course: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  curricularYear: z.number().int().positive().optional(),
  nif: z.string().regex(nifRegex, "NIF inválido").optional(),
  birthDate: z.string().regex(isoDateRegex, "Data inválida").optional(),
});
export type BeneficiaryInput = z.infer<typeof beneficiarySchema>;

export const beneficiaryFullSchema = beneficiarySchema.extend({
  id: z.union([z.string().min(1), z.number()]),
});
export type Beneficiary = z.infer<typeof beneficiaryFullSchema>;

/* =================================================
 *                    FAMÍLIAS
 * ===============================================*/
export const familyInputSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  notes: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export const familySchema = familyInputSchema.extend({
  id: z.union([z.string().min(1), z.number()]),
  createdAt: z.string().regex(isoDateRegex, "Data inválida").optional(),
  updatedAt: z.string().regex(isoDateRegex, "Data inválida").optional(),
});
export type FamilyInput = z.infer<typeof familyInputSchema>;
export type Family = z.infer<typeof familySchema>;

/* =================================================
 *                    DOADORES
 * ===============================================*/
export const donorTypeSchema = z.enum(["COMPANY", "PRIVATE"]);
export type DonorType = z.infer<typeof donorTypeSchema>;

export const donorInputSchema = z.object({
  type: donorTypeSchema,
  name: z.string().min(1, "Nome obrigatório"),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  nif: z
    .string()
    .regex(nifRegex, "NIF inválido")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  address: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  postalCode: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export const donorSchema = donorInputSchema.extend({
  id: z.union([z.string().min(1), z.number()]),
  createdAt: z.string().regex(isoDateRegex, "Data inválida").optional(),
  updatedAt: z.string().regex(isoDateRegex, "Data inválida").optional(),
});
export type DonorInput = z.infer<typeof donorInputSchema>;
export type Donor = z.infer<typeof donorSchema>;

/* =================================================
 *                 ITEMS (ARTIGOS)
 * ===============================================*/
export const unitSchema = z.enum(["KG", "UNIT", "PACK", "L"]);
export type Unit = z.infer<typeof unitSchema>;

export const itemInputSchema = z.object({
  sku: z.string().min(1, "SKU obrigatório"),
  name: z.string().min(1, "Nome obrigatório"),
  familyId: z.union([z.string().min(1), z.number()]),
  unit: unitSchema,
  minStock: z.number().int().min(0).default(0),
  eanCodes: z.array(z.string().min(8)).optional(), // múltiplos EANs
  /** Campo denormalizado — soma de remainingQty dos lotes */
  stockCurrent: z.number().int().min(0).optional(),
  notes: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  /** Localização/prateleira (ex.: "A1-03" ou "Estante B / Prat. 2") */
  locationCode: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export const itemSchema = itemInputSchema.extend({
  id: z.union([z.string().min(1), z.number()]),
  createdAt: z.string().regex(isoDateRegex, "Data inválida").optional(),
  updatedAt: z.string().regex(isoDateRegex, "Data inválida").optional(),
});
export type ItemInput = z.infer<typeof itemInputSchema>;
export type Item = z.infer<typeof itemSchema>;

/* =================================================
 *                 STOCK LOTS (entradas)
 * ===============================================*/
export const stockLotInputSchema = z.object({
  itemId: z.union([z.string().min(1), z.number()]),
  lot: z.string().min(1, "Lote obrigatório"),
  quantity: z.number().int().min(0),
  remainingQty: z.number().int().min(0),
  entryDate: z.string().regex(isoDateRegex, "Data inválida"),
  expiryDate: z.string().regex(isoDateRegex, "Data inválida").optional(),
  donorId: z
    .union([z.string().min(1), z.number()])
    .nullable()
    .optional(),
  /** Opcional: localização específica do lote (se diferente do item) */
  locationCode: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export const stockLotSchema = stockLotInputSchema.extend({
  id: z.union([z.string().min(1), z.number()]),
});
export type StockLotInput = z.infer<typeof stockLotInputSchema>;
export type StockLot = z.infer<typeof stockLotSchema>;

/* =================================================
 *                 MOVIMENTOS DE STOCK
 * ===============================================*/
export const stockMoveTypeSchema = z.enum(["IN", "OUT", "ADJUST", "TRANSFER"]);
export type StockMoveType = z.infer<typeof stockMoveTypeSchema>;

/** Core SEM refinements (suporta extend) */
const stockMoveCore = z.object({
  itemId: z.union([z.string().min(1), z.number()]),
  lotId: z.union([z.string().min(1), z.number()]),
  type: stockMoveTypeSchema,
  quantity: z.number().int(), // o sinal é validado no refine
  reason: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  docRef: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  fromLocation: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  toLocation: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  createdAt: z.string().optional(), // ISO
  user: z.string().optional(),
});

/** Refinement: só permite quantidade negativa quando type = ADJUST */
const nonAdjustNegativeBlock = (
  val: z.infer<typeof stockMoveCore>,
  ctx: z.RefinementCtx
) => {
  if (val.type !== "ADJUST" && val.quantity < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["quantity"],
      message: "Para IN/OUT/TRANSFER, quantity deve ser ≥ 0.",
    });
  }
};

/** Input = core + refine */
export const stockMoveInputSchema = stockMoveCore.superRefine(
  nonAdjustNegativeBlock
);

/** Com ID = (core extend) + refine */
export const stockMoveSchema = stockMoveCore
  .extend({ id: z.union([z.string().min(1), z.number()]) })
  .superRefine(nonAdjustNegativeBlock);

export type StockMoveInput = z.infer<typeof stockMoveInputSchema>;
export type StockMove = z.infer<typeof stockMoveSchema>;

/* =================================================
 *                 CONTAGENS DE STOCK
 * ===============================================*/
export const stockCountStatusSchema = z.enum(["OPEN", "CLOSED"]);
export type StockCountStatus = z.infer<typeof stockCountStatusSchema>;

/** Filtros livres para gerar linhas (ex.: { familyId, onlyBelowMin: true }) */
const filtersSchema = z.object({}).catchall(z.unknown());

export const stockCountInputSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  status: stockCountStatusSchema.default("OPEN"),
  createdAt: z.string().optional(),
  closedAt: z.string().optional().nullable(),
  filters: filtersSchema.optional(),
});
export const stockCountSchema = stockCountInputSchema.extend({
  id: z.union([z.string().min(1), z.number()]),
});
export type StockCountInput = z.infer<typeof stockCountInputSchema>;
export type StockCount = z.infer<typeof stockCountSchema>;

export const stockCountLineInputSchema = z.object({
  countId: z.union([z.string().min(1), z.number()]),
  itemId: z.union([z.string().min(1), z.number()]),
  lotId: z.union([z.string().min(1), z.number()]),
  expectedQty: z.number().int().min(0),
  countedQty: z.number().int().min(0).optional(),
  delta: z.number().int().optional(), // computed: counted - expected
  note: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export const stockCountLineSchema = stockCountLineInputSchema.extend({
  id: z.union([z.string().min(1), z.number()]),
});
export type StockCountLineInput = z.infer<typeof stockCountLineInputSchema>;
export type StockCountLine = z.infer<typeof stockCountLineSchema>;

/* =================================================
 *                     DOAÇÕES
 * ===============================================*/
export const donationSchema = z.object({
  id: z.union([z.string().min(1), z.number()]),
  date: z.string().regex(isoDateRegex, "Data inválida"),
  donorId: z.union([z.string().min(1), z.number()]),
  reference: z.string().optional(),
  note: z.string().optional(), // adapter mapeia notes -> note
  donorName: z.string().optional(), // ← novo (conveniência)
});
export type Donation = z.infer<typeof donationSchema>;

export const donationLineSchema = z.object({
  id: z.union([z.string().min(1), z.number()]),
  donationId: z.union([z.string().min(1), z.number()]),
  itemId: z.union([z.string().min(1), z.number()]),
  quantity: z.number().positive(),
  lot: z.string().min(1),
  expiryDate: z.string().regex(isoDateRegex, "Data inválida").optional(),
  locationCode: z.string().optional(),
  note: z.string().optional(),
  itemName: z.string().optional(), // ← novo (conveniência)
});
export type DonationLine = z.infer<typeof donationLineSchema>;
