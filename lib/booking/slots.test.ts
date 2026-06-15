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
