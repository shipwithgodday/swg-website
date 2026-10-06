import { NextResponse } from 'next/server';
import { isNotNull } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { hasAdminRole } from '@/lib/shop/auth';
import { db } from '@/lib/db';
import {
  subscribers,
  customers as shopCustomers,
} from '@/lib/db/schema';

interface Recipient {
  email: string;
  name: string | null;
  shippingMark: string | null;
}

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (!hasAdminRole(sessionClaims as { metadata?: { role?: string } } | null)) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    // The bulk-email audience is the union of two Postgres sources, deduped
    // by email: newsletter signups (`subscribers`) and shop `customers` that
    // have an email. Shop customers carry the shipping mark.
    const [subs, custs] = await Promise.all([
      db
        .select({
          email: subscribers.email,
          fullName: subscribers.fullName,
        })
        .from(subscribers),
      db
        .select({
          email: shopCustomers.email,
          name: shopCustomers.name,
          shippingMark: shopCustomers.shippingMark,
        })
        .from(shopCustomers)
        .where(isNotNull(shopCustomers.email)),
    ]);

    const byEmail = new Map<string, Recipient>();

    // Shop customers first so their shipping mark and name seed the entry.
    for (const c of custs) {
      const email = c.email?.trim();
      if (!email) continue;
      const key = email.toLowerCase();
      const existing = byEmail.get(key);
      byEmail.set(key, {
        email: existing?.email ?? email,
        name: existing?.name ?? c.name?.trim() ?? null,
        shippingMark: c.shippingMark ?? existing?.shippingMark ?? null,
      });
    }

    // Subscribers fill in any missing names and add signup-only contacts.
    for (const s of subs) {
      const email = s.email.trim();
      if (!email) continue;
      const key = email.toLowerCase();
      const existing = byEmail.get(key);
      byEmail.set(key, {
        email: existing?.email ?? email,
        name: existing?.name ?? s.fullName?.trim() ?? null,
        shippingMark: existing?.shippingMark ?? null,
      });
    }

    const formattedEmails = [...byEmail.values()]
      .map((r) => ({
        value: r.email,
        label: r.name ? `${r.name} (${r.email})` : r.email,
        shippingMark: r.shippingMark,
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, {
          sensitivity: 'base',
        })
      );

    return NextResponse.json({ emails: formattedEmails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
