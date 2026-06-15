'use server';

import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';

type BookingData = {
  date: string;
  time: string;
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email: string;
  organization?: string;
  desiredService: string;
  meetingType: string;
};

export async function createBooking(data: BookingData) {
  try {
    const [saved] = await db
      .insert(bookings)
      .values({
        date: data.date,
        time: data.time,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        whatsappNumber: data.whatsappNumber ?? null,
        email: data.email,
        organization: data.organization ?? null,
        desiredService: data.desiredService,
        meetingType: data.meetingType,
      })
      .returning();

    return {
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: saved.id,
        date: saved.date,
        time: saved.time,
        fullName: saved.fullName,
        phoneNumber: saved.phoneNumber,
        whatsappNumber: saved.whatsappNumber,
        email: saved.email,
        organization: saved.organization,
        desiredService: saved.desiredService,
        meetingType: saved.meetingType,
      },
    };
  } catch (err) {
    // Postgres unique-violation = duplicate (date, time) slot.
    if ((err as { code?: string }).code === '23505') {
      return {
        success: false,
        message: 'This time slot is already booked',
        error: 'Duplicate booking',
      };
    }
    console.error('Error creating booking:', err);
    return {
      success: false,
      message: 'Failed to create booking',
      error: (err as Error).message,
    };
  }
}
