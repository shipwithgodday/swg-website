import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import BookingModel from '@/models/Booking';

type DeleteRequestBody = {
  date: string;
  time: string;
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: DeleteRequestBody = await request.json();
    const { date, time } = body;

    if (!date || !time) {
      return NextResponse.json(
        { success: false, error: 'Date and time are required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Delete the booking
    const result = await BookingModel.deleteOne({ date, time });

    // Convert the result to a plain JS object to ensure serialization works
    const serializedResult = {
      success: true,
      deletedCount: result.deletedCount,
    };

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializedResult);
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
