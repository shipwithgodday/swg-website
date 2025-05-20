import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Customer from '@/models/Customer';

export async function GET() {
  try {
    await dbConnect();

    // Fetch all customers with email and fullName
    const customers = await Customer.find({}, 'email fullName');

    // Format the data as objects with value and label properties
    const formattedEmails = customers.map((customer) => ({
      value: customer.email,
      label: `${customer.fullName} (${customer.email})`,
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
