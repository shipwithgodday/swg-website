import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Booking from '@/models/Booking';
import Customer from '@/models/Customer';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      date,
      time,
      fullName,
      email,
      phoneNumber,
      organization,
      desiredService,
      meetingType,
    } = body;

    // Check if customer exists, if not create them
    let customer = await Customer.findOne({ email });
    if (!customer) {
      // Silently create new customer without notifying the user
      customer = await Customer.create({
        fullName,
        email,
        phoneNumber,
      });
    }

    // Create the booking
    const booking = await Booking.create({
      date,
      time,
      fullName,
      email,
      phoneNumber,
      organization,
      desiredService,
      meetingType,
    });

    return NextResponse.json({
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        date: booking.date,
        time: booking.time,
        fullName: booking.fullName,
        email: booking.email,
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
