import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const weekdayHoursSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    openTime: z.string().regex(timeRegex, 'Invalid open time'),
    closeTime: z.string().regex(timeRegex, 'Invalid close time'),
    slotMinutes: z.number().int().positive().max(480),
  })
  .refine((v) => !v.isOpen || v.openTime < v.closeTime, {
    message: 'Open time must be before close time',
    path: ['closeTime'],
  });

export const weekdayHoursArraySchema = z.array(weekdayHoursSchema).length(7);

export const blackoutDateSchema = z.object({
  date: z.string().regex(dateRegex, 'Invalid date'),
  reason: z.string().max(200).optional(),
});

export type WeekdayHoursInput = z.infer<typeof weekdayHoursSchema>;
export type BlackoutDateInput = z.infer<typeof blackoutDateSchema>;
