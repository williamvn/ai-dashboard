import type { CostMetrics, LatencyMetrics, TokenMetrics } from '@repo/types';
import { formatCompact, formatCurrency, formatLatency } from '../../../lib/format';

interface CostKpisProps {
  cost: CostMetrics;
  tokens: TokenMetrics;
  latency: LatencyMetrics;
  windowDays: number;
}

export function CostKpis({ cost, tokens, latency, windowDays }: CostKpisProps) {
  const avgCostPerDay = windowDays > 0 ? cost.totalCost / windowDays : 0;
  // Monthly projection = same daily burn rate extrapolated to 30 days. Naive on
  // purpose — the hint is meant as a directional tell, not a forecast.
  const projectedMonthly = avgCostPerDay * 30;

  const latencyHint = latency.p95Ms !== null ? `p95 ${formatLatency(latency.p95Ms)}` : 'p95 –';
  const activeUserHint = cost.totalActiveUsers > 0 ? `across ${cost.totalActiveUsers} active users` : 'no active users';

  return (
    <div className="cost-kpis">
      <Kpi
        label="Total Cost"
        value={formatCurrency(cost.totalCost)}
        hint={`all-time ${formatCurrency(cost.allTimeTotalCost)}`}
      />
      <Kpi
        label="Avg Cost / Day"
        value={formatCurrency(avgCostPerDay)}
        hint={`projected ~${formatCurrency(projectedMonthly)} / month`}
      />
      <Kpi label="Avg Cost / Call" value={formatCurrency(cost.costPerRun)} />
      <Kpi
        label="Cost / Active User"
        value={formatCurrency(cost.costPerActiveUser)}
        hint={activeUserHint}
      />
      <Kpi
        label="Total Tokens"
        value={formatCompact(tokens.totalTokens)}
        hint={`${formatCompact(tokens.tokensPerRun)} / call`}
      />
      <Kpi label="Avg Latency" value={formatLatency(latency.avgMs)} hint={latencyHint} />
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="cost-kpi">
      <span className="cost-kpi-label">{label}</span>
      <span className="cost-kpi-value">{value}</span>
      {hint && <span className="cost-kpi-hint">{hint}</span>}
    </div>
  );
}
