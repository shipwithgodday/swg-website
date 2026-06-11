import { NextResponse } from 'next/server';
import { isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  subscribers,
  customers as shopCustomers,
} from '@/lib/db/schema';

export async function GET() {
  try {
    // Recipient list (marketing signups) and shipping marks both live in
    // Postgres now. We join them by email to surface a mark next to
    // recipients that are also shop customers.
    const contacts = await db
      .select({
        email: subscribers.email,
        fullName: subscribers.fullName,
      })
      .from(subscribers);

    // email (lowercased) -> shippingMark. Best-effort: if the mark lookup
    // fails we still return the recipient list, just without marks.
    const markByEmail = new Map<string, string>();
    try {
      const rows = await db
        .select({
          email: shopCustomers.email,
          shippingMark: shopCustomers.shippingMark,
        })
        .from(shopCustomers)
        .where(isNotNull(shopCustomers.email));
      for (const row of rows) {
        if (row.email) {
          markByEmail.set(row.email.toLowerCase(), row.shippingMark);
        }
      }
    } catch (err) {
      console.error('Failed to load shipping marks for recipients:', err);
    }

    const formattedEmails = contacts.map((contact) => {
      const shippingMark =
        markByEmail.get(contact.email.toLowerCase()) ?? null;
      return {
        value: contact.email,
        label: `${contact.fullName} (${contact.email})`,
        shippingMark,
      };
    });

    return NextResponse.json({ emails: formattedEmails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
