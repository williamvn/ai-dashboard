export type DayPreset = '7d' | '14d' | '30d' | '90d';

export const DAY_PRESETS: { label: string; value: DayPreset }[] = [
  { label: '7 days', value: '7d' },
  { label: '14 days', value: '14d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
];

const DAYS_BY_PRESET: Record<DayPreset, number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
  '90d': 90,
};

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  preset: DayPreset;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function dateRangeFromPreset(preset: DayPreset): DateRange {
  const days = DAYS_BY_PRESET[preset];
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);
  return { from: toDateKey(start), to: toDateKey(end), preset };
}
