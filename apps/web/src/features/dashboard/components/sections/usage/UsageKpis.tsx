import type { UsageMetrics } from '@repo/types';
import { formatDecimal, formatNumber } from '../../../lib/format';

interface UsageKpisProps {
  usage: UsageMetrics;
  windowDays: number;
}

export function UsageKpis({ usage, windowDays }: UsageKpisProps) {
  return (
    <div className="usage-kpis">
      <Kpi label="Total Calls" value={formatNumber(usage.totalCalls)} />
      <Kpi
        label="Avg Calls / Day"
        value={formatDecimal(usage.avgCallsPerDay)}
        hint={`over ${windowDays} days`}
      />
      <Kpi
        label="Calls Per Active User"
        value={formatDecimal(usage.callsPerActiveUser)}
        hint={`${usage.totalActiveUsers} active`}
      />
      <Kpi
        label="Total Users"
        value={formatNumber(usage.totalUsers)}
        hint={`${usage.totalActiveUsers} active in window`}
      />
      <Kpi label="Avg DAU" value={formatDecimal(usage.avgDau)} hint={`over ${windowDays} days`} />
      <Kpi
        label="Adoption Rate"
        value={`${formatDecimal(usage.adoptionPercentage)}%`}
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
