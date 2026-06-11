import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';

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
  const normalizedEmail = email.toLowerCase();

  try {
    const [existing] = await db
      .select({ id: subscribers.id })
      .from(subscribers)
      .where(eq(subscribers.email, normalizedEmail))
      .limit(1);
    if (existing) {
      return NextResponse.json(
        {
          error:
            'You have already signed up with this email address. You will receive email updates automatically.',
        },
        { status: 400 }
      );
    }

    const [customer] = await db
      .insert(subscribers)
      .values({ fullName, email: normalizedEmail, phoneNumber })
      .returning({
        id: subscribers.id,
        fullName: subscribers.fullName,
        email: subscribers.email,
      });

    return NextResponse.json({
      message: 'Customer registered successfully',
      customer,
    });
  } catch (error) {
    // 23505 = unique_violation: a concurrent signup beat us to the email.
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json(
        {
          error:
            'You have already signed up with this email address. You will receive email updates automatically.',
        },
        { status: 400 }
      );
    }
    console.error('Error registering customer:', error);
    return NextResponse.json(
      { error: 'Failed to register customer' },
      { status: 500 }
    );
  }
}
