export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

export function formatDecimal(n: number, digits = 1): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
