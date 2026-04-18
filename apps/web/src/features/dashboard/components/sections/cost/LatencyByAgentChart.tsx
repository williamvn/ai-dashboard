import { useMemo } from 'react';
import type { Agent, LatencyMetrics } from '@repo/types';

// Kept in sync with the backend histogramP95 threshold in analytics.service.ts —
// the backend returns null for p95 below this sample count.
const LATENCY_P95_MIN_SAMPLES = 20;
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../../../lib/recharts';
import {
  chartAxisProps,
  chartGridProps,
  chartTooltipProps,
} from '../../../lib/chartTheme';
import { formatLatency } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface LatencyByAgentChartProps {
  latency: LatencyMetrics;
  agents: Agent[];
}

// Chosen explicitly outside AGENT_PALETTE so agent bars and latency bars never
// share a hue — avg (neutral slate) + p95 (fuchsia) are both safely distinct
// from the indigo/cyan/amber/pink/green palette assigned to agents.
const AVG_COLOR = '#94a3b8';
const P95_COLOR = '#d946ef';

export function LatencyByAgentChart({ latency, agents }: LatencyByAgentChartProps) {
  const rows = useMemo(() => {
    return agents
      .map((a) => {
        const stats = latency.byAgent[a.id];
        return {
          id: a.id,
          agent: a.name,
          avg: stats?.avgMs ?? 0,
          p95: stats?.p95Ms ?? null,
          calls: stats?.calls ?? 0,
        };
      })
      .filter((r) => r.calls > 0)
      .sort((a, b) => (b.p95 ?? b.avg) - (a.p95 ?? a.avg));
  }, [latency, agents]);

  return (
    <ChartCard
      title="Latency per Agent"
      subtitle={`Avg vs p95 (ms) — p95 hidden for n < ${LATENCY_P95_MIN_SAMPLES} samples`}
      empty={rows.length === 0}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} barGap={4}>
          <CartesianGrid {...chartGridProps} />
          <XAxis
            dataKey="agent"
            interval={0}
            {...chartAxisProps}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis tickFormatter={(v: number) => formatLatency(v)} width={56} {...chartAxisProps} />
          <Tooltip
            {...chartTooltipProps}
            cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
            formatter={(value: number | null, name: string) => [
              value === null || value === undefined ? '–' : formatLatency(value),
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
          <Bar dataKey="avg" name="Avg" fill={AVG_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="p95" name="p95" fill={P95_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
