import { z } from "zod";

export const DeliveryLineSchema = z.object({
  id: z.string(),
  deliveryId: z.string(),
  itemId: z.string(),
  itemName: z.string().optional().nullable(),
  quantity: z.number().positive(),
  lot: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export type DeliveryLineDTO = z.input<typeof DeliveryLineSchema>;
export type DeliveryLine = z.output<typeof DeliveryLineSchema>;

export function adaptDeliveryLine(dto: DeliveryLineDTO): DeliveryLine {
  return DeliveryLineSchema.parse(dto);
}
