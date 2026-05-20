import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongoose';
import Customer from '@/models/Customer';

const subscribeSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  phoneNumber: z
    .string()
    .trim()
    .min(10, 'Please enter a valid phone number'),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }
  const { fullName, email, phoneNumber } = parsed.data;

  try {
    await dbConnect();

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
