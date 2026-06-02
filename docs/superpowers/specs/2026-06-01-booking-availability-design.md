# Booking Availability & Bookings on Postgres — Design Spec

**Date:** 2026-06-01
**Feature:** Admin-configurable scheduling (booking availability) + migrate bookings from MongoDB to Postgres/Drizzle
**Builds on:** Existing `app/schedule` booking wizard and the Drizzle/Postgres admin backend

---

## Overview

Today the times a customer can book a consultation call are **hardcoded** in
`app/actions/getAvailableTimes.ts` (`ALL_TIME_SLOTS`, 10:00–17:00, identical every day),
and bookings are stored in **MongoDB** (`models/Booking.ts`) — the only part of the admin
still on Mongo. Everything else (products, orders, customers, delivery zones, shipments)
runs on Drizzle/Postgres.

This feature:

1. Moves bookings to a new Postgres `bookings` table.
2. Adds admin-editable availability: per-weekday open/close hours + slot length, plus
   one-off blackout dates (holidays).
3. Adds an admin **Scheduling** page under Settings that edits availability **and** lists
   upcoming bookings.
4. Stops the booking flow from creating customer records (bookers must not pollute the
   customers list).
5. Changes the owner booking-notification recipient to `shipwithgoddayltd@gmail.com`.

The customer-facing schedule UI (`components/schedule/*`) keeps working unchanged because
the availability function keeps its current return shape.

---

## Schema Changes (`lib/db/schema.ts`)

Conventions matched from existing tables: `uuid('id').primaryKey().defaultRandom()`,
`timestamp(..., { withTimezone: true })`, `text` for short strings.

### `bookings` — replaces `models/Booking.ts`

```ts
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: text('date').notNull(),            // 'YYYY-MM-DD'
    time: text('time').notNull(),            // 'HH:mm'
    fullName: text('full_name').notNull(),
    phoneNumber: text('phone_number').notNull(),
    whatsappNumber: text('whatsapp_number'), // nullable
    email: text('email').notNull(),
    organization: text('organization'),      // nullable
    desiredService: text('desired_service').notNull(),
    meetingType: text('meeting_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dateTimeUnique: unique('bookings_date_time_unique').on(t.date, t.time),
  })
);
```

The `(date, time)` unique constraint preserves the current "one booking per slot"
guarantee and the duplicate-detection behavior.

### `bookingWeekdayHours` — per-weekday availability config

```ts
export const bookingWeekdayHours = pgTable('booking_weekday_hours', {
  weekday: integer('weekday').primaryKey(),   // 0 = Sunday … 6 = Saturday
  isOpen: boolean('is_open').notNull().default(true),
  openTime: text('open_time').notNull(),      // 'HH:mm'
  closeTime: text('close_time').notNull(),    // 'HH:mm'
  slotMinutes: integer('slot_minutes').notNull().default(60),
});
```

Exactly 7 rows, seeded once. One global slot length per day (lean scope — no per-weekday
duration setting).

### `bookingBlackoutDates` — holidays / one-off closures

```ts
export const bookingBlackoutDates = pgTable('booking_blackout_dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: text('date').notNull().unique(),      // 'YYYY-MM-DD'
  reason: text('reason'),                       // nullable
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

A Drizzle migration is generated for all three tables (`pnpm db:generate`).

---

## Default Seed

Seed `bookingWeekdayHours` with:

| Weekday        | isOpen | open  | close | slotMinutes |
| -------------- | ------ | ----- | ----- | ----------- |
| Mon–Fri (1–5)  | true   | 10:00 | 18:00 | 60          |
| Sat, Sun (6,0) | false  | 10:00 | 18:00 | 60          |

Open weekdays regenerate today's exact 10:00–17:00 slot list (open 10:00 → close 18:00,
step 60 ⇒ 10,11,…,17 = 8 slots). Weekends are closed by default.

No blackout dates seeded.

---

## Availability Logic — rewrite `app/actions/getAvailableTimes.ts`

`getDateRangeAvailability(startDate, endDate)` rewritten against Postgres:

1. Load all 7 `bookingWeekdayHours` rows and the set of `bookingBlackoutDates` in the
   range (or all) — once.
2. Query `bookings` where `date` is within `[startDate, endDate]`, selecting `date, time`.
   Group booked times by date.
3. For each date in the range:
   - Determine weekday via `date-fns`.
   - If the weekday row `isOpen === false` **or** the date is a blackout date →
     `availableTimes = []`, `totalSlots = 0`.
   - Otherwise **generate** slot times from `openTime` to (but not including) `closeTime`
     stepping by `slotMinutes`. `totalSlots = generated.length`.
   - Subtract already-booked times for that date.
4. Return the **same shape** as today:
   `Record<string, { availableTimes: string[]; totalSlots: number; bookedSlotsCount: number }>`.

`getAvailableTimes(date)` keeps delegating to `getDateRangeAvailability`. Because the
return contract is unchanged, `components/schedule/{TimeSlotSelector,DatePicker,BookingWizard}.tsx`
need no changes.

A small pure helper `generateSlots(openTime, closeTime, slotMinutes): string[]` is added
(in `lib/calendarUtils.ts` or a new `lib/booking/slots.ts`) and unit-tested.

---

## Admin Page — `app/admin/settings/availability/page.tsx`

Server component following the `delivery-zones` pattern (`AdminPageHeader` + `MotionReveal`).
Loads the 7 weekday rows, blackout dates, and upcoming bookings, then renders two sections.

Sidebar: add a **"Scheduling"** link to the Settings group in
`components/admin/AdminSidebar.tsx`, next to "Delivery zones".

### Section 1 — Availability editor (`components/admin/AvailabilityEditor.tsx`)

Client component styled like `DeliveryZonesEditor` (modern, not plain):

- One row per weekday: open/closed toggle, open-time, close-time, slot-length input.
- Blackout-dates list: add a date (+ optional reason), remove existing ones.
- Saves via server actions.

### Section 2 — Bookings list

- **Upcoming bookings** (`date >= today`) shown by default, ordered by `date, time` ascending.
- A toggle ("Show past bookings") reveals past bookings (`date < today`, descending).
- Each row shows: date, time, full name, phone/email, desired service, meeting type.
- Reuses the existing booking-delete capability (see API) for removing a booking.

---

## Server Actions (`app/actions/`)

- `saveWeekdayHours(rows)` — upsert the 7 weekday rows. Validates `openTime < closeTime`
  and `slotMinutes > 0`. `revalidatePath` the admin page.
- `addBlackoutDate({ date, reason? })` / `removeBlackoutDate(id)`.
- `getUpcomingBookings()` / `getPastBookings()` (or one server-side query in the page).

All guarded by the existing admin auth (`isAdmin()` / Clerk), matching other admin actions.

---

## Mongo → Postgres Rewrites

These four files currently import `models/Booking` and are rewritten to use Drizzle:

| File | Change |
| ---- | ------ |
| `app/actions/getAvailableTimes.ts` | Query Drizzle `bookings` + availability config (above). |
| `app/actions/createBooking.ts` | Insert into Drizzle `bookings`; map Postgres unique-violation to the existing "time slot already booked" message. |
| `app/api/bookings/route.ts` | Insert booking into Drizzle. **Remove the `Customer` find/create entirely** — bookers are not added to any customers table. |
| `app/api/bookings/delete/route.ts` | Delete from Drizzle `bookings` by `(date, time)`. |

`app/api/bookings/emails/route.ts` is left as-is (it reads existing Mongo `Customer`
records for the admin email dropdown — a separate feature). After this change, bookings no
longer feed that list.

The Mongo `models/Booking.ts` file is removed once nothing references it.

---

## Email Recipient Change

In `components/schedule/BookingWizard.tsx` (~line 151) the owner-notification `to:` is
changed from `'info@shipwithgodday.com'` to `'shipwithgoddayltd@gmail.com'`. The customer
confirmation and the `from:` sender (`info@shipwithgodday.com`, the verified Resend domain)
are unchanged.

---

## Migration & Seed Scripts (`scripts/`)

- `scripts/migrate-bookings.ts` — one-time: connect to Mongo, read all `Booking`
  documents, insert into Postgres `bookings` (skip/ignore duplicate `(date,time)`).
  Added to `package.json` scripts (e.g. `migrate:bookings`), run with the existing
  `tsx --env-file .env.local` pattern.
- `scripts/seed-booking-hours.ts` — upsert the 7 weekday rows per the seed table above.
  Added as `seed:booking-hours`.

---

## Testing

- Unit test `generateSlots` (boundaries: exact close time excluded, non-divisible ranges,
  closed day, slotMinutes variations).
- Unit/integration test `getDateRangeAvailability`: closed weekday → no slots; blackout
  date → no slots; booked time removed; correct `totalSlots` / `bookedSlotsCount`.
- Manual: book a slot end-to-end, confirm it disappears; edit weekday hours and confirm
  the schedule page reflects them; confirm owner email arrives at the new address.

---

## Out of Scope (YAGNI)

- Minimum lead time and booking-window settings.
- Per-weekday slot length (one global duration per day).
- Customer unification between Mongo and Postgres.
- Timezone handling changes (existing behavior preserved).
