import { z } from "zod";

export const DeliveryStatusSchema = z.enum([
  "NOT_DELIVERED",
  "DELIVERED",
  "FAILED",
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

export const DeliverySchema = z.object({
  id: z.string(),
  beneficiaryId: z.string(),
  beneficiaryName: z.string().optional().nullable(),
  scheduledId: z.string().optional().nullable(),
  status: DeliveryStatusSchema,
  deliveredAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DeliveryDTO = z.input<typeof DeliverySchema>;
export type Delivery = z.output<typeof DeliverySchema>;

export function adaptDelivery(dto: DeliveryDTO): Delivery {
  return DeliverySchema.parse(dto);
}
