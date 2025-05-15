'use server';

import { neon } from '@neondatabase/serverless';

type BookingData = {
  date: string;
  time: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  desiredService: string;
  meetingType: string;
};

export async function createBooking(data: BookingData) {
  const {
    date,
    time,
    fullName,
    phoneNumber,
    email,
    desiredService,
    meetingType,
  } = data;

  // connect to Neon
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // insert the new booking
    const result = await sql`
      INSERT INTO bookings (
        date,
        time,
        fullName,
        phoneNumber,
        email,
        desiredService,
        meetingType
      ) VALUES (
        ${date},
        ${time},
        ${fullName},
        ${phoneNumber},
        ${email},
        ${desiredService},
        ${meetingType}
      )
      RETURNING *;
    `;

    return {
      success: true,
      message: 'Booking created successfully',
      booking: result[0],
    };
  } catch (err) {
    console.error('Error creating booking:', err);
    return {
      success: false,
      message: 'Failed to create booking',
      error: (err as Error).message,
    };
  }
}
