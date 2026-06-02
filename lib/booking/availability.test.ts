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
