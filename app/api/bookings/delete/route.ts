import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { isAdmin } from '@/lib/shop/auth';

type DeleteRequestBody = {
  date: string;
  time: string;
};

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: DeleteRequestBody = await request.json();
    const { date, time } = body;

    if (!date || !time) {
      return NextResponse.json(
        { success: false, error: 'Date and time are required' },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(bookings)
      .where(and(eq(bookings.date, date), eq(bookings.time, time)))
      .returning();

    return NextResponse.json({
      success: true,
      deletedCount: deleted.length,
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
