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
