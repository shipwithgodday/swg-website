'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  bookings,
  bookingWeekdayHours,
  bookingBlackoutDates,
} from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import {
  weekdayHoursArraySchema,
  blackoutDateSchema,
} from '@/lib/booking/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

const PAGE_PATH = '/admin/settings/availability';

export async function saveWeekdayHours(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = weekdayHoursArraySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  try {
    for (const row of parsed.data) {
      await db
        .update(bookingWeekdayHours)
        .set({
          isOpen: row.isOpen,
          openTime: row.openTime,
          closeTime: row.closeTime,
          slotMinutes: row.slotMinutes,
        })
        .where(eq(bookingWeekdayHours.weekday, row.weekday));
    }
  } catch {
    return { ok: false, error: 'Failed to save availability.' };
  }
  revalidatePath(PAGE_PATH);
  return { ok: true };
}

export async function addBlackoutDate(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = blackoutDateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  try {
    await db.insert(bookingBlackoutDates).values({
      date: parsed.data.date,
      reason: parsed.data.reason ?? null,
    });
  } catch {
    return { ok: false, error: 'That date is already blocked.' };
  }
  revalidatePath(PAGE_PATH);
  return { ok: true };
}

export async function removeBlackoutDate(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(bookingBlackoutDates).where(eq(bookingBlackoutDates.id, id));
  revalidatePath(PAGE_PATH);
  return { ok: true };
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(bookings).where(eq(bookings.id, id));
  revalidatePath(PAGE_PATH);
  return { ok: true };
}
