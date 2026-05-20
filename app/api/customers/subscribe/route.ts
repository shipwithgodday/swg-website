import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Customer from '@/models/Customer';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { fullName, email, phoneNumber } = body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return NextResponse.json(
        {
          error:
            'You have already signed up with this email address. You will receive email updates automatically.',
        },
        { status: 400 }
      );
    }

    // Create new customer
    const customer = await Customer.create({
      fullName,
      email,
      phoneNumber,
    });

    return NextResponse.json({
      message: 'Customer registered successfully',
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error('Error registering customer:', error);
    return NextResponse.json(
      { error: 'Failed to register customer' },
      { status: 500 }
    );
  }
}
