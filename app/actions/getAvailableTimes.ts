'use server';

import { neon } from '@neondatabase/serverless';
import { addDays, parseISO, format } from 'date-fns';

const ALL_TIME_SLOTS = [
  '12:00',
  '12:45',
  '13:00',
  '13:45',
  '14:00',
  '14:45',
  '15:00',
  '15:45',
  '16:00',
  '16:45',
  '17:00',
  '17:45',
];

// This is the key optimization - we'll fetch availability for multiple dates at once
export async function getDateRangeAvailability(
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate) {
    throw new Error('Date range is required');
  }

  // Instantiate a connection to your Neon (Vercel Postgres) database
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // Fetch all bookings within the date range in a single query
    const result = (await sql`
      SELECT date, time
      FROM bookings
      WHERE date BETWEEN ${startDate} AND ${endDate}
      ORDER BY date, time;
    `) as { date: string; time: string }[];

    // Group bookings by date for easier processing
    const bookingsByDate = result.reduce((acc, { date, time }) => {
      if (!acc[date]) acc[date] = [];
      acc[date].push(time);
      return acc;
    }, {} as Record<string, string[]>);

    // Calculate available time slots for each date in the range
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const availabilityMap: Record<
      string,
      {
        availableTimes: string[];
        totalSlots: number;
        bookedSlotsCount: number;
      }
    > = {};

    // Loop through each date in the range
    let current = start;
    while (current <= end) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const bookedTimes = bookingsByDate[dateStr] || [];

      // Filter out booked slots
      const availableTimes = ALL_TIME_SLOTS.filter(
        (slot) => !bookedTimes.includes(slot)
      );

      availabilityMap[dateStr] = {
        availableTimes,
        totalSlots: ALL_TIME_SLOTS.length,
        bookedSlotsCount: bookedTimes.length,
      };

      current = addDays(current, 1);
    }

    return availabilityMap;
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

  // Get the availability just for this single date
  try {
    const availabilityMap = await getDateRangeAvailability(
      date,
      date
    );
    return availabilityMap[date];
  } catch (err) {
    console.error('Error fetching available times:', err);
    throw new Error('Database error');
  }
}
