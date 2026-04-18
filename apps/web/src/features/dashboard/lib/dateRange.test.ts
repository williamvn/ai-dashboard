import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dateRangeFromPreset, enumerateDays } from './dateRange';

describe('enumerateDays', () => {
  it('returns every day in [from, to] inclusive', () => {
    expect(enumerateDays('2026-01-01', '2026-01-03')).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ]);
  });

  it('returns the single day when from equals to', () => {
    expect(enumerateDays('2026-01-01', '2026-01-01')).toEqual(['2026-01-01']);
  });

  it('returns an empty array when to precedes from', () => {
    expect(enumerateDays('2026-01-05', '2026-01-01')).toEqual([]);
  });

  it('returns an empty array for invalid date strings', () => {
    expect(enumerateDays('not-a-date', '2026-01-01')).toEqual([]);
    expect(enumerateDays('2026-01-01', 'not-a-date')).toEqual([]);
  });

  it('spans month boundaries correctly', () => {
    const days = enumerateDays('2026-01-30', '2026-02-02');
    expect(days).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
  });
});

describe('dateRangeFromPreset', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-18T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('anchors "to" at today and walks back N-1 days for the preset length', () => {
    const { from, to, preset } = dateRangeFromPreset('7d');
    expect(to).toBe('2026-04-18');
    expect(from).toBe('2026-04-12'); // 7 days inclusive → 6 days back
    expect(preset).toBe('7d');
  });

  it('produces a 30-day window for the 30d preset', () => {
    const { from, to } = dateRangeFromPreset('30d');
    const days = enumerateDays(from, to);
    expect(days).toHaveLength(30);
  });

  it('produces a 90-day window for the 90d preset', () => {
    const { from, to } = dateRangeFromPreset('90d');
    const days = enumerateDays(from, to);
    expect(days).toHaveLength(90);
  });
});
