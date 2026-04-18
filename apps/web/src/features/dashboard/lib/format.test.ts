import { describe, expect, it } from 'vitest';
import {
  formatCompact,
  formatCurrency,
  formatDecimal,
  formatLatency,
  formatNumber,
  formatPercent,
} from './format';

describe('formatNumber', () => {
  it('rounds to the nearest integer and adds thousands separators', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(1234.5)).toBe('1,235');
    expect(formatNumber(1_234_567)).toBe('1,234,567');
  });
});

describe('formatDecimal', () => {
  it('emits a fixed number of fraction digits by default', () => {
    expect(formatDecimal(0)).toBe('0.0');
    expect(formatDecimal(1.23)).toBe('1.2');
    expect(formatDecimal(1.25)).toBe('1.3'); // banker’s rounding or half-up; both land on 1.3
  });

  it('respects the digits parameter', () => {
    expect(formatDecimal(0.12345, 3)).toBe('0.123');
    expect(formatDecimal(10, 0)).toBe('10');
  });
});

describe('formatCompact', () => {
  it('switches to compact notation past a thousand', () => {
    expect(formatCompact(999)).toBe('999');
    expect(formatCompact(1_500)).toBe('1.5K');
    expect(formatCompact(12_400)).toBe('12.4K');
    expect(formatCompact(3_100_000)).toBe('3.1M');
  });
});

describe('formatCurrency', () => {
  it('returns "$0" for zero or non-finite input', () => {
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(NaN)).toBe('$0');
    expect(formatCurrency(Infinity)).toBe('$0');
  });

  it('picks precision based on magnitude so fractional cents remain legible', () => {
    expect(formatCurrency(0.0001)).toBe('$0.0001');
    expect(formatCurrency(0.5)).toBe('$0.500');
    expect(formatCurrency(12.34)).toBe('$12.34');
  });

  it('drops fraction digits and adds the currency symbol past $100', () => {
    expect(formatCurrency(1_234)).toBe('$1,234');
    expect(formatCurrency(1_234_567)).toBe('$1,234,567');
  });
});

describe('formatLatency', () => {
  it('returns "0 ms" for non-finite or non-positive input', () => {
    expect(formatLatency(0)).toBe('0 ms');
    expect(formatLatency(-50)).toBe('0 ms');
    expect(formatLatency(NaN)).toBe('0 ms');
  });

  it('renders sub-second values in milliseconds', () => {
    expect(formatLatency(123)).toBe('123 ms');
    expect(formatLatency(999)).toBe('999 ms');
    expect(formatLatency(500.6)).toBe('501 ms');
  });

  it('switches to seconds with one decimal past a second', () => {
    expect(formatLatency(1_000)).toBe('1.0 s');
    expect(formatLatency(2_500)).toBe('2.5 s');
    expect(formatLatency(12_340)).toBe('12.3 s');
  });
});

describe('formatPercent', () => {
  it('returns "0%" for non-finite input so 0/0 divisions never render as NaN%', () => {
    expect(formatPercent(NaN)).toBe('0%');
    expect(formatPercent(Infinity)).toBe('0%');
  });

  it('multiplies the 0–1 ratio by 100 with one decimal by default', () => {
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(0.5)).toBe('50.0%');
    expect(formatPercent(1)).toBe('100.0%');
    expect(formatPercent(0.1234)).toBe('12.3%');
  });

  it('respects a custom digit count for axis ticks vs KPI callouts', () => {
    expect(formatPercent(0.5, 0)).toBe('50%');
    expect(formatPercent(0.5, 2)).toBe('50.00%');
  });

  it('does not clamp ratios above 1 — the caller decides what is valid', () => {
    expect(formatPercent(1.5)).toBe('150.0%');
  });
});
