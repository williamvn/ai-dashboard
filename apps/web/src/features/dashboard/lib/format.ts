export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

export function formatDecimal(n: number, digits = 1): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Compact number formatting (e.g. 12.4k, 3.1M) for dense KPI displays.
 */
export function formatCompact(n: number): string {
  return n.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });
}

/**
 * USD cost formatting. Picks precision based on magnitude so fractional-cent
 * agent costs remain legible while headline totals stay clean.
 */
export function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  if (n === 0) return '$0';
  const abs = Math.abs(n);
  if (abs < 0.01) return `$${n.toFixed(4)}`;
  if (abs < 1) return `$${n.toFixed(3)}`;
  if (abs < 100) return `$${n.toFixed(2)}`;
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function formatLatency(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0 ms';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}
