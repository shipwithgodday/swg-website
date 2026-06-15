'use server';

import { and, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  bookings,
  bookingWeekdayHours,
  bookingBlackoutDates,
} from '@/lib/db/schema';
import { computeAvailability } from '@/lib/booking/availability';

export async function getDateRangeAvailability(
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate) {
    throw new Error('Date range is required');
  }

  try {
    const [hours, blackouts, booked] = await Promise.all([
      db.select().from(bookingWeekdayHours),
      db
        .select({ date: bookingBlackoutDates.date })
        .from(bookingBlackoutDates)
        .where(
          and(
            gte(bookingBlackoutDates.date, startDate),
            lte(bookingBlackoutDates.date, endDate)
          )
        ),
      db
        .select({ date: bookings.date, time: bookings.time })
        .from(bookings)
        .where(and(gte(bookings.date, startDate), lte(bookings.date, endDate))),
    ]);

    const bookedByDate = booked.reduce(
      (acc: Record<string, string[]>, { date, time }) => {
        (acc[date] ||= []).push(time);
        return acc;
      },
      {}
    );

    return computeAvailability({
      startDate,
      endDate,
      weekdayHours: hours,
      blackoutDates: new Set(blackouts.map((b) => b.date)),
      bookedByDate,
    });
  } catch (err) {
    console.error('Error fetching available times:', err);
    throw new Error('Database error');
  }
}

// Kept for backward compatibility
export async function getAvailableTimes(date: string) {
  if (!date) {
    throw new Error('Date is required');
  }
  const availabilityMap = await getDateRangeAvailability(date, date);
  return availabilityMap[date];
}
