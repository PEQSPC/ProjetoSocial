import { z } from "zod"

const nifRegex = /^[0-9]{9}$/
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

export const beneficiarySchema = z.object({
  studentNumber: z.string().min(1, "Obrigatório"),
  name: z.string().min(1, "Obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().trim().optional().or(z.literal("")).transform(v => v || undefined),
  course: z.string().trim().optional().or(z.literal("")).transform(v => v || undefined),
  curricularYear: z.number().int().positive().optional(),
  // novos
  nif: z.string().regex(nifRegex, "NIF inválido").optional(),
  birthDate: z.string().regex(isoDateRegex, "Data inválida").optional(),
})
export type BeneficiaryInput = z.infer<typeof beneficiarySchema>
