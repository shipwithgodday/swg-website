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
