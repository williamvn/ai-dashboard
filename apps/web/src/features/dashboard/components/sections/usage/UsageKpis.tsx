import type { UsageMetrics } from '@repo/types';

interface UsageKpisProps {
  usage: UsageMetrics;
  windowDays: number;
}

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

function formatDecimal(n: number, digits = 1): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function UsageKpis({ usage, windowDays }: UsageKpisProps) {
  const avgCallsPerDay = windowDays > 0 ? usage.totalCalls / windowDays : 0;

  const totalDau = Object.values(usage.dauPerDay).reduce((sum, v) => sum + v, 0);
  const avgDau = windowDays > 0 ? totalDau / windowDays : 0;

  const callsPerActiveUser =
    usage.totalActiveUsers > 0 ? usage.totalCalls / usage.totalActiveUsers : 0;

  const adoption = usage.adoptionPercentage;

  return (
    <div className="usage-kpis">
      <Kpi label="Total Calls" value={formatNumber(usage.totalCalls)} />
      <Kpi
        label="Avg Calls / Day"
        value={formatDecimal(avgCallsPerDay)}
        hint={`over ${windowDays} days`}
      />
      <Kpi
        label="Calls Per Active User"
        value={formatDecimal(callsPerActiveUser)}
        hint={`${usage.totalActiveUsers} active`}
      />
      <Kpi
        label="Total Users"
        value={formatNumber(usage.totalUsers)}
        hint={`${usage.totalActiveUsers} active in window`}
      />
      <Kpi label="Avg DAU" value={formatDecimal(avgDau)} hint={`over ${windowDays} days`} />
      <Kpi
        label="Adoption Rate"
        value={`${formatDecimal(adoption)}%`}
        hint="avg DAU / total users"
      />
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="usage-kpi">
      <span className="usage-kpi-label">{label}</span>
      <span className="usage-kpi-value">{value}</span>
      {hint && <span className="usage-kpi-hint">{hint}</span>}
    </div>
  );
}
