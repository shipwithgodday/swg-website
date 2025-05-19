import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Booking from '@/models/Booking';

export async function GET() {
  try {
    await dbConnect();

    // Fetch distinct email addresses from the bookings
    const emails = await Booking.distinct('email');

    // Format the emails as objects with value and label properties
    const formattedEmails = emails.map((email) => ({
      value: email,
      label: email,
    }));

    return NextResponse.json({ emails: formattedEmails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
