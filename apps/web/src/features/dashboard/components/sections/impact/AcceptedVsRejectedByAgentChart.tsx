import { useMemo } from 'react';
import type { Agent } from '@repo/types';
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
import { formatNumber } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

const ACCEPTED_COLOR = '#4ade80';
const REJECTED_COLOR = '#64748b';

interface AcceptedVsRejectedByAgentChartProps {
  acceptedByAgent: Record<string, number>;
  rejectedByAgent: Record<string, number>;
  agents: Agent[];
}

export function AcceptedVsRejectedByAgentChart({
  acceptedByAgent,
  rejectedByAgent,
  agents,
}: AcceptedVsRejectedByAgentChartProps) {
  const rows = useMemo(() => {
    return agents
      .map((a) => ({
        id: a.id,
        agent: a.name,
        accepted: acceptedByAgent[a.id] ?? 0,
        rejected: rejectedByAgent[a.id] ?? 0,
      }))
      .filter((r) => r.accepted + r.rejected > 0)
      .sort((a, b) => b.accepted + b.rejected - (a.accepted + a.rejected));
  }, [agents, acceptedByAgent, rejectedByAgent]);

  return (
    <ChartCard
      title="Accepted vs Rejected Outputs"
      subtitle="Volume of reviewed outputs per agent"
      empty={rows.length === 0}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis
            dataKey="agent"
            interval={0}
            {...chartAxisProps}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis tickFormatter={(v: number) => formatNumber(v)} width={48} {...chartAxisProps} />
          <Tooltip
            {...chartTooltipProps}
            cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
            formatter={(value: number, name: string) => [formatNumber(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
          <Bar
            dataKey="accepted"
            name="Accepted"
            stackId="validated"
            fill={ACCEPTED_COLOR}
            radius={[0, 0, 0, 0]}
            maxBarSize={64}
          />
          <Bar
            dataKey="rejected"
            name="Rejected"
            stackId="validated"
            fill={REJECTED_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={64}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
