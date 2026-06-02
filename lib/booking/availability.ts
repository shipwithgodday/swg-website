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
