// src/adapters/schedules.ts
import { z } from "zod";

/* =============================
 * Tipos
 * ============================= */

export const scheduleTypes = ["DELIVERY", "PICKUP"] as const;
export type ScheduleType = (typeof scheduleTypes)[number];

export const scheduleStatuses = [
  "PLANNED",
  "CONFIRMED",
  "DONE",
  "CANCELLED",
] as const;
export type ScheduleStatus = (typeof scheduleStatuses)[number];

export const scheduleDTO = z.object({
  id: z.string(),
  type: z.enum(scheduleTypes),
  status: z.enum(scheduleStatuses),

  date: z.string(), // "YYYY-MM-DD"
  timeSlot: z.string().nullable().optional(),

  // Se for DELIVERY
  beneficiaryId: z.string().optional().nullable(),
  beneficiaryName: z.string().optional().nullable(),

  // Se for PICKUP
  donorId: z.string().optional().nullable(),
  donorName: z.string().optional().nullable(),

  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),

  // ligações
  deliveryId: z.string().optional().nullable(),
  donationId: z.string().optional().nullable(),

  // atribuição
  assignee: z.string().optional().nullable(),
  assigneeName: z.string().optional().nullable(),

  // timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ScheduleDTO = z.infer<typeof scheduleDTO>;

export const schedule = scheduleDTO.transform((d) => d);
export type Schedule = z.infer<typeof schedule>;

/* =============================
 * Helpers
 * ============================= */
export const schedulesPath = "/schedules";

export function toSchedule(input: unknown): Schedule {
  const parsed = scheduleDTO.parse(input);
  return parsed;
}

export function toSchedules(input: unknown): Schedule[] {
  const arr = Array.isArray(input) ? input : [];
  return arr.map(toSchedule);
}
