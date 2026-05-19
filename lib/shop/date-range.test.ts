import {
  DASHBOARD_RANGES,
  DEFAULT_RANGE,
  parseRange,
  rangeDays,
  rangeToSince,
} from './date-range';

describe('parseRange', () => {
  it('accepts every valid range key', () => {
    for (const r of DASHBOARD_RANGES) {
      expect(parseRange(r)).toBe(r);
    }
  });
  it('falls back to the default for unknown or missing values', () => {
    expect(parseRange('nonsense')).toBe(DEFAULT_RANGE);
    expect(parseRange(undefined)).toBe(DEFAULT_RANGE);
  });
});

describe('rangeDays', () => {
  it('maps range keys to day counts', () => {
    expect(rangeDays('today')).toBe(1);
    expect(rangeDays('7d')).toBe(7);
    expect(rangeDays('30d')).toBe(30);
    expect(rangeDays('90d')).toBe(90);
  });
});

describe('rangeToSince', () => {
  it('returns a rolling window `rangeDays` before now', () => {
    const now = new Date('2026-05-19T12:00:00.000Z');
    expect(rangeToSince('7d', now).toISOString()).toBe(
      '2026-05-12T12:00:00.000Z'
    );
    expect(rangeToSince('30d', now).toISOString()).toBe(
      '2026-04-19T12:00:00.000Z'
    );
  });
  it('treats "today" as the start of the current UTC day', () => {
    const now = new Date('2026-05-19T12:00:00.000Z');
    expect(rangeToSince('today', now).toISOString()).toBe(
      '2026-05-19T00:00:00.000Z'
    );
  });
});
