'use server';

import dbConnect from '@/lib/mongoose';
import BookingModel from '@/models/Booking';

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
  const {
    date,
    time,
    fullName,
    phoneNumber,
    whatsappNumber,
    email,
    organization,
    desiredService,
    meetingType,
  } = data;

  try {
    // Connect to MongoDB
    await dbConnect();

    // Create a new booking document
    const newBooking = new BookingModel({
      date,
      time,
      fullName,
      phoneNumber,
      whatsappNumber,
      email,
      organization,
      desiredService,
      meetingType,
    });

    // Save the booking
    const savedBooking = await newBooking.save();

    // Convert to a plain JavaScript object without Mongoose methods
    // This ensures it can be serialized for client components
    const serializedBooking = JSON.parse(
      JSON.stringify({
        date: savedBooking.date,
        time: savedBooking.time,
        fullName: savedBooking.fullName,
        phoneNumber: savedBooking.phoneNumber,
        whatsappNumber: savedBooking.whatsappNumber,
        email: savedBooking.email,
        organization: savedBooking.organization,
        desiredService: savedBooking.desiredService,
        meetingType: savedBooking.meetingType,
        id: savedBooking._id.toString(),
      })
    );

    return {
      success: true,
      message: 'Booking created successfully',
      booking: serializedBooking,
    };
  } catch (err) {
    console.error('Error creating booking:', err);

    // Check for duplicate key error (booking already exists)
    if ((err as Error & { code?: number }).code === 11000) {
      return {
        success: false,
        message: 'This time slot is already booked',
        error: 'Duplicate booking',
      };
    }

    return {
      success: false,
      message: 'Failed to create booking',
      error: (err as Error).message,
    };
  }
}
