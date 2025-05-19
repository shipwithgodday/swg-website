'use server';

import { addDays, parseISO, format } from 'date-fns';
import dbConnect from '@/lib/mongoose';
import BookingModel from '@/models/Booking';

const ALL_TIME_SLOTS = [
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

// This is the key optimization - we'll fetch availability for multiple dates at once
export async function getDateRangeAvailability(
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate) {
    throw new Error('Date range is required');
  }

  try {
    // Connect to MongoDB
    await dbConnect();

    // Fetch all bookings within the date range in a single query
    // Use lean() to get plain JS objects instead of Mongoose documents
    const bookings = await BookingModel.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .select('date time')
      .lean();

    // Convert MongoDB documents to plain JS objects
    const serializedBookings = bookings.map((booking) => ({
      date: booking.date,
      time: booking.time,
    }));

    // Group bookings by date for easier processing
    const bookingsByDate = serializedBookings.reduce(
      (acc: Record<string, string[]>, { date, time }) => {
        if (!acc[date]) acc[date] = [];
        acc[date].push(time);
        return acc;
      },
      {} as Record<string, string[]>
    );

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
