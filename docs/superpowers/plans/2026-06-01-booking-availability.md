# Booking Availability & Bookings on Postgres — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded consultation-call time slots with admin-editable availability (per-weekday hours + blackout dates) and move bookings from MongoDB to Postgres/Drizzle, with an admin "Scheduling" page that edits availability and lists bookings.

**Architecture:** Three new Drizzle tables (`bookings`, `bookingWeekdayHours`, `bookingBlackoutDates`). All availability math lives in two pure, unit-tested functions (`generateSlots`, `computeAvailability`); the server action that the customer UI already calls (`getDateRangeAvailability`) becomes a thin DB wrapper around them and keeps its exact return shape, so the customer-facing schedule UI (`components/schedule/*`, `lib/booking-context.tsx`) needs zero changes. A new admin page under `/admin/settings/availability` edits the config and lists bookings via server actions that follow the existing `app/actions/shop/*` pattern.

**Tech Stack:** Next.js (App Router, server actions), Drizzle ORM + Neon Postgres, Zod, Clerk auth (`requireAdmin`/`isAdmin`), Jest + ts-jest, `tsx` for scripts, Mongoose (read-only, migration script only).

**Context note (codebase changed during planning):** The `/admin/settings/delivery-zones` page and `DeliveryZonesEditor` referenced in the spec were deleted mid-planning by commit `45e336b` (delivery zones removed), and the `Settings` sidebar section no longer exists. This plan therefore *creates* the Settings sidebar section fresh and mirrors the still-present `app/actions/shop/categories.ts` action pattern and `AdminPageHeader`/`MotionReveal` components instead.

---

## File Structure

**Create:**
- `lib/booking/slots.ts` — pure `generateSlots(openTime, closeTime, slotMinutes)`.
- `lib/booking/slots.test.ts` — unit tests for slot generation.
- `lib/booking/availability.ts` — pure `computeAvailability(...)` + shared types.
- `lib/booking/availability.test.ts` — unit tests for availability computation.
- `lib/booking/validation.ts` — Zod schemas for the admin forms.
- `app/actions/bookingAvailability.ts` — admin server actions (save hours, blackout add/remove, delete booking).
- `components/admin/AvailabilityEditor.tsx` — client editor for weekday hours + blackout dates.
- `components/admin/BookingsList.tsx` — client list of upcoming/past bookings with delete.
- `app/admin/settings/availability/page.tsx` — admin Scheduling page (server component).
- `scripts/migrate-bookings.ts` — one-time Mongo→Postgres copy (self-contained Mongoose model).
- `scripts/seed-booking-hours.ts` — seed the 7 weekday rows.

**Modify:**
- `lib/db/schema.ts` — add the three tables.
- `app/actions/getAvailableTimes.ts` — rewrite against Postgres + pure compute.
- `app/actions/createBooking.ts` — rewrite to insert into Postgres `bookings`.
- `app/api/bookings/route.ts` — insert into Postgres; remove customer creation.
- `app/api/bookings/delete/route.ts` — delete from Postgres; add admin guard.
- `components/schedule/BookingWizard.tsx` — change owner-notification recipient.
- `components/admin/AdminSidebar.tsx` — add a Settings section with a Scheduling link.
- `package.json` — add `seed:booking-hours` and `migrate:bookings` scripts.

**Delete (last task):**
- `models/Booking.ts` — Mongo model, after nothing references it.

---

### Task 1: Add the three Drizzle tables

**Files:**
- Modify: `lib/db/schema.ts` (append new tables; `uuid`, `text`, `integer`, `boolean`, `timestamp`, `uniqueIndex`, and the shared `timestamps` object are already imported/defined at the top)

- [ ] **Step 1: Add the tables to the schema**

Append to the end of `lib/db/schema.ts`:

```ts
// ── Booking / scheduling ────────────────────────────────────────────────

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: text('date').notNull(), // 'YYYY-MM-DD'
    time: text('time').notNull(), // 'HH:mm'
    fullName: text('full_name').notNull(),
    phoneNumber: text('phone_number').notNull(),
    whatsappNumber: text('whatsapp_number'),
    email: text('email').notNull(),
    organization: text('organization'),
    desiredService: text('desired_service').notNull(),
    meetingType: text('meeting_type').notNull(),
    ...timestamps,
  },
  (t) => ({
    dateTimeUnique: uniqueIndex('bookings_date_time_unique').on(
      t.date,
      t.time
    ),
  })
);

export const bookingWeekdayHours = pgTable('booking_weekday_hours', {
  weekday: integer('weekday').primaryKey(), // 0 = Sunday … 6 = Saturday
  isOpen: boolean('is_open').notNull().default(true),
  openTime: text('open_time').notNull(), // 'HH:mm'
  closeTime: text('close_time').notNull(), // 'HH:mm'
  slotMinutes: integer('slot_minutes').notNull().default(60),
});

export const bookingBlackoutDates = pgTable('booking_blackout_dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: text('date').notNull().unique(), // 'YYYY-MM-DD'
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

- [ ] **Step 2: Generate the migration**

Run: `pnpm db:generate`
Expected: a new file appears under `drizzle/` containing `CREATE TABLE "bookings"`, `"booking_weekday_hours"`, `"booking_blackout_dates"` and a unique index `bookings_date_time_unique`.

- [ ] **Step 3: Apply the migration**

Run: `pnpm db:migrate`
Expected: completes without error; the three tables now exist in the database.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat(booking): add bookings, weekday-hours, blackout-dates tables"
```

---

### Task 2: Pure slot generator (`generateSlots`)

**Files:**
- Create: `lib/booking/slots.ts`
- Test: `lib/booking/slots.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/booking/slots.test.ts`:

```ts
import { generateSlots } from './slots';

describe('generateSlots', () => {
  it('generates hourly slots, excluding the close time', () => {
    expect(generateSlots('10:00', '18:00', 60)).toEqual([
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
    ]);
  });

  it('supports sub-hour intervals with zero-padding', () => {
    expect(generateSlots('09:00', '10:30', 30)).toEqual([
      '09:00',
      '09:30',
      '10:00',
    ]);
  });

  it('stops before close even when the range is not divisible by the interval', () => {
    expect(generateSlots('10:00', '11:20', 30)).toEqual(['10:00', '10:30', '11:00']);
  });

  it('returns empty when open equals close', () => {
    expect(generateSlots('10:00', '10:00', 60)).toEqual([]);
  });

  it('returns empty for a non-positive interval', () => {
    expect(generateSlots('10:00', '18:00', 0)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/booking/slots.test.ts`
Expected: FAIL — cannot find module `./slots`.

- [ ] **Step 3: Write the implementation**

`lib/booking/slots.ts`:

```ts
/** Generate 'HH:mm' slot start times from openTime up to (not including) closeTime. */
export function generateSlots(
  openTime: string,
  closeTime: string,
  slotMinutes: number
): string[] {
  if (slotMinutes <= 0) return [];

  const toMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const pad = (n: number): string => String(n).padStart(2, '0');

  const start = toMinutes(openTime);
  const end = toMinutes(closeTime);
  const slots: string[] = [];

  for (let m = start; m < end; m += slotMinutes) {
    slots.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return slots;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/booking/slots.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/booking/slots.ts lib/booking/slots.test.ts
git commit -m "feat(booking): add pure generateSlots helper"
```

---

### Task 3: Pure availability computation (`computeAvailability`)

**Files:**
- Create: `lib/booking/availability.ts`
- Test: `lib/booking/availability.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/booking/availability.test.ts`:

```ts
import { computeAvailability, type WeekdayHours } from './availability';

// 2026-06-01 is a Monday (getDay === 1); 2026-06-06 is a Saturday (getDay === 6); 2026-06-07 is a Sunday (getDay === 0).
const HOURS: WeekdayHours[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  isOpen: weekday >= 1 && weekday <= 5,
  openTime: '10:00',
  closeTime: '18:00',
  slotMinutes: 60,
}));

describe('computeAvailability', () => {
  it('generates slots for an open weekday', () => {
    const map = computeAvailability({
      startDate: '2026-06-01',
      endDate: '2026-06-01',
      weekdayHours: HOURS,
      blackoutDates: new Set(),
      bookedByDate: {},
    });
    expect(map['2026-06-01'].availableTimes).toEqual([
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
    ]);
    expect(map['2026-06-01'].totalSlots).toBe(8);
    expect(map['2026-06-01'].bookedSlotsCount).toBe(0);
  });

  it('returns no slots on a closed weekday (Saturday)', () => {
    const map = computeAvailability({
      startDate: '2026-06-06',
      endDate: '2026-06-06',
      weekdayHours: HOURS,
      blackoutDates: new Set(),
      bookedByDate: {},
    });
    expect(map['2026-06-06'].availableTimes).toEqual([]);
    expect(map['2026-06-06'].totalSlots).toBe(0);
  });

  it('returns no slots on a blackout date even if the weekday is open', () => {
    const map = computeAvailability({
      startDate: '2026-06-01',
      endDate: '2026-06-01',
      weekdayHours: HOURS,
      blackoutDates: new Set(['2026-06-01']),
      bookedByDate: {},
    });
    expect(map['2026-06-01'].availableTimes).toEqual([]);
  });

  it('removes already-booked times and counts them', () => {
    const map = computeAvailability({
      startDate: '2026-06-01',
      endDate: '2026-06-01',
      weekdayHours: HOURS,
      blackoutDates: new Set(),
      bookedByDate: { '2026-06-01': ['11:00', '15:00'] },
    });
    expect(map['2026-06-01'].availableTimes).not.toContain('11:00');
    expect(map['2026-06-01'].availableTimes).not.toContain('15:00');
    expect(map['2026-06-01'].bookedSlotsCount).toBe(2);
    expect(map['2026-06-01'].totalSlots).toBe(8);
  });

  it('covers every date in the range', () => {
    const map = computeAvailability({
      startDate: '2026-06-01',
      endDate: '2026-06-07',
      weekdayHours: HOURS,
      blackoutDates: new Set(),
      bookedByDate: {},
    });
    expect(Object.keys(map)).toHaveLength(7);
    expect(map['2026-06-07'].availableTimes).toEqual([]); // Sunday, closed
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/booking/availability.test.ts`
Expected: FAIL — cannot find module `./availability`.

- [ ] **Step 3: Write the implementation**

`lib/booking/availability.ts`:

```ts
import { addDays, parseISO, format, getDay } from 'date-fns';
import { generateSlots } from './slots';

export interface WeekdayHours {
  weekday: number; // 0 = Sunday … 6 = Saturday
  isOpen: boolean;
  openTime: string; // 'HH:mm'
  closeTime: string; // 'HH:mm'
  slotMinutes: number;
}

export interface DateAvailability {
  availableTimes: string[];
  totalSlots: number;
  bookedSlotsCount: number;
}

export function computeAvailability(params: {
  startDate: string;
  endDate: string;
  weekdayHours: WeekdayHours[];
  blackoutDates: Set<string>;
  bookedByDate: Record<string, string[]>;
}): Record<string, DateAvailability> {
  const { startDate, endDate, weekdayHours, blackoutDates, bookedByDate } =
    params;

  const byWeekday = new Map<number, WeekdayHours>();
  for (const w of weekdayHours) byWeekday.set(w.weekday, w);

  const result: Record<string, DateAvailability> = {};
  const end = parseISO(endDate);
  let current = parseISO(startDate);

  while (current <= end) {
    const dateStr = format(current, 'yyyy-MM-dd');
    const cfg = byWeekday.get(getDay(current));

    let allSlots: string[] = [];
    if (cfg && cfg.isOpen && !blackoutDates.has(dateStr)) {
      allSlots = generateSlots(cfg.openTime, cfg.closeTime, cfg.slotMinutes);
    }

    const booked = bookedByDate[dateStr] ?? [];
    result[dateStr] = {
      availableTimes: allSlots.filter((s) => !booked.includes(s)),
      totalSlots: allSlots.length,
      bookedSlotsCount: booked.length,
    };

    current = addDays(current, 1);
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/booking/availability.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/booking/availability.ts lib/booking/availability.test.ts
git commit -m "feat(booking): add pure computeAvailability helper"
```

---

### Task 4: Rewrite `getAvailableTimes` against Postgres

**Files:**
- Modify: `app/actions/getAvailableTimes.ts` (full rewrite)

- [ ] **Step 1: Replace the file contents**

`app/actions/getAvailableTimes.ts`:

```ts
'use server';

import { and, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  bookings,
  bookingWeekdayHours,
  bookingBlackoutDates,
} from '@/lib/db/schema';
import { computeAvailability } from '@/lib/booking/availability';

export async function getDateRangeAvailability(
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate) {
    throw new Error('Date range is required');
  }

  try {
    const [hours, blackouts, booked] = await Promise.all([
      db.select().from(bookingWeekdayHours),
      db
        .select({ date: bookingBlackoutDates.date })
        .from(bookingBlackoutDates)
        .where(
          and(
            gte(bookingBlackoutDates.date, startDate),
            lte(bookingBlackoutDates.date, endDate)
          )
        ),
      db
        .select({ date: bookings.date, time: bookings.time })
        .from(bookings)
        .where(and(gte(bookings.date, startDate), lte(bookings.date, endDate))),
    ]);

    const bookedByDate = booked.reduce(
      (acc: Record<string, string[]>, { date, time }) => {
        (acc[date] ||= []).push(time);
        return acc;
      },
      {}
    );

    return computeAvailability({
      startDate,
      endDate,
      weekdayHours: hours,
      blackoutDates: new Set(blackouts.map((b) => b.date)),
      bookedByDate,
    });
  } catch (err) {
    console.error('Error fetching available times:', err);
    throw new Error('Database error');
  }
}

// Kept for backward compatibility
export async function getAvailableTimes(date: string) {
  if (!date) {
    throw new Error('Date is required');
  }
  const availabilityMap = await getDateRangeAvailability(date, date);
  return availabilityMap[date];
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `app/actions/getAvailableTimes.ts`. (`hours` rows match `WeekdayHours` structurally.)

- [ ] **Step 3: Commit**

```bash
git add app/actions/getAvailableTimes.ts
git commit -m "feat(booking): compute availability from Postgres config"
```

---

### Task 5: Rewrite `createBooking` against Postgres

**Files:**
- Modify: `app/actions/createBooking.ts` (full rewrite)

Note: the caller `components/schedule/BookingWizard.tsx` checks `result.success` and `result.error`, so the return shape must keep `{ success, message, error?, booking? }`.

- [ ] **Step 1: Replace the file contents**

`app/actions/createBooking.ts`:

```ts
'use server';

import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';

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
  try {
    const [saved] = await db
      .insert(bookings)
      .values({
        date: data.date,
        time: data.time,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        whatsappNumber: data.whatsappNumber ?? null,
        email: data.email,
        organization: data.organization ?? null,
        desiredService: data.desiredService,
        meetingType: data.meetingType,
      })
      .returning();

    return {
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: saved.id,
        date: saved.date,
        time: saved.time,
        fullName: saved.fullName,
        phoneNumber: saved.phoneNumber,
        whatsappNumber: saved.whatsappNumber,
        email: saved.email,
        organization: saved.organization,
        desiredService: saved.desiredService,
        meetingType: saved.meetingType,
      },
    };
  } catch (err) {
    // Postgres unique-violation = duplicate (date, time) slot.
    if ((err as { code?: string }).code === '23505') {
      return {
        success: false,
        message: 'This time slot is already booked',
        error: 'Duplicate booking',
      };
    }
    console.error('Error creating booking:', err);
    return {
      success: false,
      message: 'Failed to create booking',
      error: (err as Error).message,
    };
  }
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in `app/actions/createBooking.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/actions/createBooking.ts
git commit -m "feat(booking): store bookings in Postgres"
```

---

### Task 6: Rewrite the booking API routes (Postgres + no customer creation)

**Files:**
- Modify: `app/api/bookings/route.ts` (full rewrite — remove the Mongo `Customer` find/create)
- Modify: `app/api/bookings/delete/route.ts` (full rewrite — delete from Postgres, add admin guard)

- [ ] **Step 1: Replace `app/api/bookings/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date,
      time,
      fullName,
      email,
      phoneNumber,
      whatsappNumber,
      organization,
      desiredService,
      meetingType,
    } = body;

    // Bookers are intentionally NOT added to the customers table.
    const [booking] = await db
      .insert(bookings)
      .values({
        date,
        time,
        fullName,
        email,
        phoneNumber,
        whatsappNumber: whatsappNumber ?? null,
        organization: organization ?? null,
        desiredService,
        meetingType,
      })
      .returning();

    return NextResponse.json({
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        date: booking.date,
        time: booking.time,
        fullName: booking.fullName,
        email: booking.email,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Replace `app/api/bookings/delete/route.ts`**

```ts
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
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors in either route file.

- [ ] **Step 4: Commit**

```bash
git add app/api/bookings/route.ts app/api/bookings/delete/route.ts
git commit -m "feat(booking): move booking API routes to Postgres, drop customer creation"
```

---

### Task 7: Zod validation schemas

**Files:**
- Create: `lib/booking/validation.ts`

(`zod` is already a dependency — used by `lib/shop/validation`.)

- [ ] **Step 1: Write the file**

`lib/booking/validation.ts`:

```ts
import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const weekdayHoursSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    openTime: z.string().regex(timeRegex, 'Invalid open time'),
    closeTime: z.string().regex(timeRegex, 'Invalid close time'),
    slotMinutes: z.number().int().positive().max(480),
  })
  .refine((v) => !v.isOpen || v.openTime < v.closeTime, {
    message: 'Open time must be before close time',
    path: ['closeTime'],
  });

export const weekdayHoursArraySchema = z.array(weekdayHoursSchema).length(7);

export const blackoutDateSchema = z.object({
  date: z.string().regex(dateRegex, 'Invalid date'),
  reason: z.string().max(200).optional(),
});

export type WeekdayHoursInput = z.infer<typeof weekdayHoursSchema>;
export type BlackoutDateInput = z.infer<typeof blackoutDateSchema>;
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/booking/validation.ts
git commit -m "feat(booking): add availability form validation schemas"
```

---

### Task 8: Admin server actions

**Files:**
- Create: `app/actions/bookingAvailability.ts`

Follows the `app/actions/shop/categories.ts` pattern (`'use server'`, `requireAdmin()`, Zod `safeParse`, `ActionResult`, `revalidatePath`).

- [ ] **Step 1: Write the file**

`app/actions/bookingAvailability.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  bookings,
  bookingWeekdayHours,
  bookingBlackoutDates,
} from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import {
  weekdayHoursArraySchema,
  blackoutDateSchema,
} from '@/lib/booking/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

const PAGE_PATH = '/admin/settings/availability';

export async function saveWeekdayHours(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = weekdayHoursArraySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  try {
    for (const row of parsed.data) {
      await db
        .update(bookingWeekdayHours)
        .set({
          isOpen: row.isOpen,
          openTime: row.openTime,
          closeTime: row.closeTime,
          slotMinutes: row.slotMinutes,
        })
        .where(eq(bookingWeekdayHours.weekday, row.weekday));
    }
  } catch {
    return { ok: false, error: 'Failed to save availability.' };
  }
  revalidatePath(PAGE_PATH);
  return { ok: true };
}

export async function addBlackoutDate(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = blackoutDateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  try {
    await db.insert(bookingBlackoutDates).values({
      date: parsed.data.date,
      reason: parsed.data.reason ?? null,
    });
  } catch {
    return { ok: false, error: 'That date is already blocked.' };
  }
  revalidatePath(PAGE_PATH);
  return { ok: true };
}

export async function removeBlackoutDate(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(bookingBlackoutDates).where(eq(bookingBlackoutDates.id, id));
  revalidatePath(PAGE_PATH);
  return { ok: true };
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(bookings).where(eq(bookings.id, id));
  revalidatePath(PAGE_PATH);
  return { ok: true };
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/actions/bookingAvailability.ts
git commit -m "feat(booking): admin actions for availability config and booking deletion"
```

---

### Task 9: `AvailabilityEditor` client component

**Files:**
- Create: `components/admin/AvailabilityEditor.tsx`

- [ ] **Step 1: Write the component**

`components/admin/AvailabilityEditor.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import {
  saveWeekdayHours,
  addBlackoutDate,
  removeBlackoutDate,
} from '@/app/actions/bookingAvailability';

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export interface WeekdayRow {
  weekday: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
}

export interface BlackoutRow {
  id: string;
  date: string;
  reason: string | null;
}

export function AvailabilityEditor({
  initialHours,
  initialBlackouts,
}: {
  initialHours: WeekdayRow[];
  initialBlackouts: BlackoutRow[];
}) {
  // Ensure rows are ordered Sun→Sat for a stable display.
  const [rows, setRows] = useState<WeekdayRow[]>(
    [...initialHours].sort((a, b) => a.weekday - b.weekday)
  );
  const [blackouts, setBlackouts] = useState<BlackoutRow[]>(initialBlackouts);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateRow(weekday: number, patch: Partial<WeekdayRow>) {
    setRows((prev) =>
      prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r))
    );
  }

  function onSaveHours() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await saveWeekdayHours(rows);
      if (res.ok) setMessage('Availability saved.');
      else setError(res.error);
    });
  }

  function onAddBlackout() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await addBlackoutDate({
        date: newDate,
        reason: newReason || undefined,
      });
      if (res.ok) {
        // Optimistic local add; server revalidation will reconcile.
        setBlackouts((prev) =>
          [
            ...prev,
            { id: `tmp-${newDate}`, date: newDate, reason: newReason || null },
          ].sort((a, b) => a.date.localeCompare(b.date))
        );
        setNewDate('');
        setNewReason('');
        setMessage('Blackout date added.');
      } else {
        setError(res.error);
      }
    });
  }

  function onRemoveBlackout(id: string) {
    startTransition(async () => {
      const res = await removeBlackoutDate(id);
      if (res.ok) setBlackouts((prev) => prev.filter((b) => b.id !== id));
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-8">
      {/* Weekly hours */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Weekly hours</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Slots are generated from the open time up to the close time in steps
          of the slot length. Close days you don&apos;t take calls.
        </p>
        <div className="mt-4 space-y-2">
          {rows.map((r) => (
            <div
              key={r.weekday}
              className="grid grid-cols-1 items-center gap-3 rounded-xl border border-zinc-100 p-3 sm:grid-cols-[8rem_auto_1fr]"
            >
              <span className="text-sm font-medium text-zinc-800">
                {WEEKDAY_LABELS[r.weekday]}
              </span>
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={r.isOpen}
                  onChange={(e) =>
                    updateRow(r.weekday, { isOpen: e.target.checked })
                  }
                  className="size-4 accent-primary"
                />
                Open
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={r.openTime}
                  disabled={!r.isOpen}
                  onChange={(e) =>
                    updateRow(r.weekday, { openTime: e.target.value })
                  }
                  className="rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:opacity-40"
                />
                <span className="text-zinc-400">to</span>
                <input
                  type="time"
                  value={r.closeTime}
                  disabled={!r.isOpen}
                  onChange={(e) =>
                    updateRow(r.weekday, { closeTime: e.target.value })
                  }
                  className="rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:opacity-40"
                />
                <label className="flex items-center gap-1 text-sm text-zinc-600">
                  <input
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={r.slotMinutes}
                    disabled={!r.isOpen}
                    onChange={(e) =>
                      updateRow(r.weekday, {
                        slotMinutes: Number(e.target.value),
                      })
                    }
                    className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:opacity-40"
                  />
                  min slots
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onSaveHours}
          disabled={isPending}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save hours'}
        </button>
      </section>

      {/* Blackout dates */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">Blackout dates</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Block specific days (holidays, time off). No slots show on these dates.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="min-w-48 flex-1 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={onAddBlackout}
            disabled={isPending || !newDate}
            className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {blackouts.length === 0 && (
            <li className="text-sm text-zinc-400">No blackout dates.</li>
          )}
          {blackouts.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium text-zinc-800">{b.date}</span>
                {b.reason ? (
                  <span className="text-zinc-500"> — {b.reason}</span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => onRemoveBlackout(b.id)}
                disabled={isPending || b.id.startsWith('tmp-')}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/AvailabilityEditor.tsx
git commit -m "feat(booking): availability editor UI"
```

---

### Task 10: `BookingsList` client component

**Files:**
- Create: `components/admin/BookingsList.tsx`

- [ ] **Step 1: Write the component**

`components/admin/BookingsList.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { deleteBooking } from '@/app/actions/bookingAvailability';

export interface BookingRow {
  id: string;
  date: string;
  time: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  desiredService: string;
  meetingType: string;
}

function Row({
  b,
  onDelete,
  pending,
}: {
  b: BookingRow;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-3 py-2 text-sm font-medium text-zinc-800">
        {b.date}
        <span className="ml-2 text-zinc-500">{b.time}</span>
      </td>
      <td className="px-3 py-2 text-sm text-zinc-700">{b.fullName}</td>
      <td className="px-3 py-2 text-sm text-zinc-500">
        <div>{b.email}</div>
        <div>{b.phoneNumber}</div>
      </td>
      <td className="px-3 py-2 text-sm text-zinc-600">{b.desiredService}</td>
      <td className="px-3 py-2 text-sm text-zinc-600">{b.meetingType}</td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onDelete(b.id)}
          disabled={pending}
          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export function BookingsList({
  upcoming,
  past,
}: {
  upcoming: BookingRow[];
  past: BookingRow[];
}) {
  const [showPast, setShowPast] = useState(false);
  const [upcomingRows, setUpcomingRows] = useState(upcoming);
  const [pastRows, setPastRows] = useState(past);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteBooking(id);
      if (res.ok) {
        setUpcomingRows((prev) => prev.filter((b) => b.id !== id));
        setPastRows((prev) => prev.filter((b) => b.id !== id));
      } else {
        setError(res.error);
      }
    });
  }

  const rows = showPast ? pastRows : upcomingRows;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">
          {showPast ? 'Past bookings' : 'Upcoming bookings'}
        </h3>
        <button
          type="button"
          onClick={() => setShowPast((v) => !v)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {showPast ? 'Show upcoming' : 'Show past bookings'}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">
          {showPast ? 'No past bookings.' : 'No upcoming bookings.'}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Contact</th>
                <th className="px-3 py-2 font-semibold">Service</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <Row key={b.id} b={b} onDelete={onDelete} pending={isPending} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/BookingsList.tsx
git commit -m "feat(booking): admin bookings list with delete and past toggle"
```

---

### Task 11: Admin Scheduling page + sidebar link

**Files:**
- Create: `app/admin/settings/availability/page.tsx`
- Modify: `components/admin/AdminSidebar.tsx` (add Settings section + icon import)

- [ ] **Step 1: Write the page**

`app/admin/settings/availability/page.tsx`:

```tsx
import { asc, gte, lt, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { db } from '@/lib/db';
import {
  bookings,
  bookingWeekdayHours,
  bookingBlackoutDates,
} from '@/lib/db/schema';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import {
  AvailabilityEditor,
  type WeekdayRow,
  type BlackoutRow,
} from '@/components/admin/AvailabilityEditor';
import {
  BookingsList,
  type BookingRow,
} from '@/components/admin/BookingsList';
import { MotionReveal } from '@/components/shared/MotionReveal';

export default async function AvailabilityPage() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const [hours, blackouts, upcoming, past] = await Promise.all([
    db
      .select()
      .from(bookingWeekdayHours)
      .orderBy(asc(bookingWeekdayHours.weekday)),
    db
      .select()
      .from(bookingBlackoutDates)
      .orderBy(asc(bookingBlackoutDates.date)),
    db
      .select()
      .from(bookings)
      .where(gte(bookings.date, today))
      .orderBy(asc(bookings.date), asc(bookings.time)),
    db
      .select()
      .from(bookings)
      .where(lt(bookings.date, today))
      .orderBy(desc(bookings.date), desc(bookings.time)),
  ]);

  const hourRows: WeekdayRow[] = hours.map((h) => ({
    weekday: h.weekday,
    isOpen: h.isOpen,
    openTime: h.openTime,
    closeTime: h.closeTime,
    slotMinutes: h.slotMinutes,
  }));

  const blackoutRows: BlackoutRow[] = blackouts.map((b) => ({
    id: b.id,
    date: b.date,
    reason: b.reason,
  }));

  const toBookingRow = (b: (typeof upcoming)[number]): BookingRow => ({
    id: b.id,
    date: b.date,
    time: b.time,
    fullName: b.fullName,
    email: b.email,
    phoneNumber: b.phoneNumber,
    desiredService: b.desiredService,
    meetingType: b.meetingType,
  });

  return (
    <div className="space-y-6">
      <MotionReveal>
        <AdminPageHeader
          title="Scheduling"
          description="Set the exact times customers can book consultation calls, block off holidays, and review bookings."
        />
      </MotionReveal>
      <MotionReveal delay={0.05} className="max-w-3xl">
        <AvailabilityEditor
          initialHours={hourRows}
          initialBlackouts={blackoutRows}
        />
      </MotionReveal>
      <MotionReveal delay={0.1}>
        <BookingsList
          upcoming={upcoming.map(toBookingRow)}
          past={past.map(toBookingRow)}
        />
      </MotionReveal>
    </div>
  );
}
```

- [ ] **Step 2: Add the sidebar Settings section**

In `components/admin/AdminSidebar.tsx`, add `CalendarClock` to the existing `lucide-react` import (find the line that imports `Mail`, `Ship`, etc. and add `CalendarClock` to that list).

Then add a new group to the end of the `NAV` array (after the `Marketing` group, before the closing `];`):

```ts
  {
    section: 'Settings',
    items: [
      {
        href: '/admin/settings/availability',
        label: 'Scheduling',
        icon: CalendarClock,
      },
    ],
  },
```

- [ ] **Step 3: Type-check and build the route**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm dev` and visit `/admin/settings/availability` as an admin.
Expected: page renders with the weekly-hours editor (7 rows), blackout-date section, and a bookings list; the sidebar shows a "Settings → Scheduling" link. (If the weekday rows are empty, that's expected until Task 12 seeds them.)

- [ ] **Step 4: Commit**

```bash
git add app/admin/settings/availability/page.tsx components/admin/AdminSidebar.tsx
git commit -m "feat(booking): admin Scheduling page and sidebar link"
```

---

### Task 12: Change the owner-notification email recipient

**Files:**
- Modify: `components/schedule/BookingWizard.tsx` (~line 151)

- [ ] **Step 1: Change the recipient**

In `components/schedule/BookingWizard.tsx`, in the owner-notification fetch body, change:

```ts
          to: 'info@shipwithgodday.com',
```

to:

```ts
          to: 'shipwithgoddayltd@gmail.com',
```

(Leave the client-confirmation email `to: values.email` and everything else unchanged.)

- [ ] **Step 2: Verify there is exactly one occurrence changed**

Run: `grep -n "shipwithgoddayltd@gmail.com\|info@shipwithgodday.com" components/schedule/BookingWizard.tsx`
Expected: the owner-notification line now reads `shipwithgoddayltd@gmail.com`; no stray `info@shipwithgodday.com` remains in this file.

- [ ] **Step 3: Commit**

```bash
git add components/schedule/BookingWizard.tsx
git commit -m "feat(booking): send owner booking notifications to shipwithgoddayltd@gmail.com"
```

---

### Task 13: Seed script + run seed

**Files:**
- Create: `scripts/seed-booking-hours.ts`
- Modify: `package.json` (add `seed:booking-hours`)

- [ ] **Step 1: Write the seed script**

`scripts/seed-booking-hours.ts`:

```ts
import { db } from '../lib/db';
import { bookingWeekdayHours } from '../lib/db/schema';

// 0 = Sunday … 6 = Saturday. Mon–Fri open 10:00–18:00 (=> 10:00–17:00 hourly slots), weekends closed.
const ROWS = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  isOpen: weekday >= 1 && weekday <= 5,
  openTime: '10:00',
  closeTime: '18:00',
  slotMinutes: 60,
}));

async function main() {
  for (const row of ROWS) {
    await db
      .insert(bookingWeekdayHours)
      .values(row)
      .onConflictDoUpdate({
        target: bookingWeekdayHours.weekday,
        set: {
          isOpen: row.isOpen,
          openTime: row.openTime,
          closeTime: row.closeTime,
          slotMinutes: row.slotMinutes,
        },
      });
  }
  console.log('Seeded booking weekday hours (Mon–Fri open, weekends closed).');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Add the package.json script**

In `package.json`, in the `"scripts"` block, add:

```json
    "seed:booking-hours": "tsx --env-file .env.local scripts/seed-booking-hours.ts",
```

- [ ] **Step 3: Run the seed**

Run: `pnpm seed:booking-hours`
Expected: prints "Seeded booking weekday hours (Mon–Fri open, weekends closed)." and exits 0.

- [ ] **Step 4: Verify in the app**

Run: `pnpm dev`, visit `/admin/settings/availability`.
Expected: 7 weekday rows show; Mon–Fri are "Open" 10:00–18:00 with 60-min slots; Sat & Sun are unchecked (closed). Visiting the public `/schedule` page, a weekday offers 10:00–17:00 slots and a weekend offers none.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-booking-hours.ts package.json
git commit -m "feat(booking): seed default weekday availability"
```

---

### Task 14: One-time migration of existing Mongo bookings

**Files:**
- Create: `scripts/migrate-bookings.ts`
- Modify: `package.json` (add `migrate:bookings`)

The script defines its own Mongoose model inline so it does not depend on `models/Booking.ts` (which is deleted in Task 15).

- [ ] **Step 1: Write the migration script**

`scripts/migrate-bookings.ts`:

```ts
import mongoose from 'mongoose';
import { db } from '../lib/db';
import { bookings } from '../lib/db/schema';

const MONGODB_URI = process.env.MONGODB_URI;

const BookingSchema = new mongoose.Schema(
  {
    date: String,
    time: String,
    fullName: String,
    phoneNumber: String,
    whatsappNumber: String,
    email: String,
    organization: String,
    desiredService: String,
    meetingType: String,
  },
  { timestamps: true }
);

interface MongoBooking {
  date: string;
  time: string;
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email: string;
  organization?: string;
  desiredService: string;
  meetingType: string;
  createdAt?: Date;
  updatedAt?: Date;
}

async function main() {
  if (!MONGODB_URI) {
    console.log('MONGODB_URI not set — nothing to migrate.');
    process.exit(0);
  }

  await mongoose.connect(MONGODB_URI);
  const BookingModel =
    mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

  const docs = (await BookingModel.find({}).lean()) as unknown as MongoBooking[];
  console.log(`Found ${docs.length} MongoDB bookings.`);

  let inserted = 0;
  let skipped = 0;

  for (const d of docs) {
    try {
      await db.insert(bookings).values({
        date: d.date,
        time: d.time,
        fullName: d.fullName,
        phoneNumber: d.phoneNumber ?? '',
        whatsappNumber: d.whatsappNumber ?? null,
        email: d.email,
        organization: d.organization ?? null,
        desiredService: d.desiredService,
        meetingType: d.meetingType,
        createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
        updatedAt: d.updatedAt ? new Date(d.updatedAt) : undefined,
      });
      inserted++;
    } catch (e) {
      if ((e as { code?: string }).code === '23505') {
        skipped++;
        continue;
      }
      throw e;
    }
  }

  console.log(`Inserted ${inserted}, skipped ${skipped} duplicate (date,time).`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Add the package.json script**

In `package.json`, in the `"scripts"` block, add:

```json
    "migrate:bookings": "tsx --env-file .env.local scripts/migrate-bookings.ts",
```

- [ ] **Step 3: Run the migration**

Run: `pnpm migrate:bookings`
Expected: prints the found/inserted/skipped counts and exits 0. (If `MONGODB_URI` is unset or there are no Mongo bookings, it reports nothing to migrate — that is fine.)

- [ ] **Step 4: Spot-check**

Visit `/admin/settings/availability` and confirm any previously-existing bookings appear under upcoming/past as appropriate.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-bookings.ts package.json
git commit -m "feat(booking): one-time MongoDB→Postgres bookings migration script"
```

---

### Task 15: Remove the Mongo Booking model

**Files:**
- Delete: `models/Booking.ts`

- [ ] **Step 1: Confirm nothing references it**

Run: `grep -rn "models/Booking" app components lib scripts`
Expected: **no results** (Tasks 4–6 removed all imports; the migration script defines its own inline model).

- [ ] **Step 2: Delete the file**

```bash
git rm models/Booking.ts
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(booking): remove unused MongoDB Booking model"
```

---

### Task 16: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass, including `lib/booking/slots.test.ts` and `lib/booking/availability.test.ts`.

- [ ] **Step 2: Type-check the whole project**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: no new errors in the files touched by this plan.

- [ ] **Step 4: End-to-end manual check**

1. As admin, open `/admin/settings/availability`. Close Wednesday, add a blackout date next week, save.
2. On the public `/schedule` page, confirm Wednesday and the blackout date show no slots, and an open weekday shows the configured slots.
3. Complete a booking; confirm it disappears from the slot list and appears under "Upcoming bookings" in admin.
4. Confirm the owner notification arrives at `shipwithgoddayltd@gmail.com`, and that the booker was **not** added to `/admin/customers`.
5. Delete the test booking from the admin bookings list; confirm it disappears and the slot frees up.

---

## Self-Review

**Spec coverage:**
- 3 Postgres tables → Task 1. ✓
- Per-weekday hours + slot length + blackout dates → Tasks 1, 7, 8, 9. ✓
- Weekends-closed seed (Mon–Fri 10:00–18:00/60m) → Task 13. ✓
- Availability logic rewrite, same return shape → Tasks 2, 3, 4 (customer UI untouched; verified `lib/booking-context.tsx` consumes only `availableTimes`/`bookedSlotsCount`). ✓
- Admin Scheduling page with availability editor + bookings list (upcoming default, past toggle) → Tasks 9, 10, 11. ✓
- Sidebar "Scheduling" link (Settings section created fresh) → Task 11. ✓
- Mongo→Postgres rewrites of the 4 booking files; booking flow no longer creates a customer → Tasks 4, 5, 6. ✓
- Owner email → `shipwithgoddayltd@gmail.com` → Task 12. ✓
- Migration + seed scripts → Tasks 13, 14; Mongo model removed → Task 15. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code; every command has expected output. ✓

**Type consistency:** `WeekdayHours` (lib/booking) and `WeekdayRow` (editor) share the same five fields; `computeAvailability` params match the shapes produced in `getAvailableTimes.ts`; `ActionResult` is `{ ok: true } | { ok: false; error }` consistently across actions and components; `createBooking` keeps `{ success, message, error? }` for `BookingWizard`; the `'23505'` Postgres unique-violation code is used consistently in `createBooking`, the POST route, and the migration script. ✓
