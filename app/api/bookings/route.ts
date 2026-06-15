import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date,
      time,
      fullName,
      email,
      phoneNumber,
      whatsappNumber,
      organization,
      desiredService,
      meetingType,
    } = body;

    // Bookers are intentionally NOT added to the customers table.
    const [booking] = await db
      .insert(bookings)
      .values({
        date,
        time,
        fullName,
        email,
        phoneNumber,
        whatsappNumber: whatsappNumber ?? null,
        organization: organization ?? null,
        desiredService,
        meetingType,
      })
      .returning();

    return NextResponse.json({
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        date: booking.date,
        time: booking.time,
        fullName: booking.fullName,
        email: booking.email,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
