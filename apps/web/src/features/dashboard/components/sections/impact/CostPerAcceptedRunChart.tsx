import { useMemo } from 'react';
import type { Agent } from '@repo/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../../../lib/recharts';
import {
  buildAgentColorMap,
  chartAxisProps,
  chartGridProps,
  chartTooltipProps,
} from '../../../lib/chartTheme';
import { formatCurrency } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface CostPerAcceptedRunChartProps {
  costPerAcceptedRunByAgent: Record<string, number>;
  acceptedByAgent: Record<string, number>;
  agents: Agent[];
}

export function CostPerAcceptedRunChart({
  costPerAcceptedRunByAgent,
  acceptedByAgent,
  agents,
}: CostPerAcceptedRunChartProps) {
  const agentColors = useMemo(() => buildAgentColorMap(agents), [agents]);

  const rows = useMemo(() => {
    return agents
      .map((a) => ({
        id: a.id,
        agent: a.name,
        cost: costPerAcceptedRunByAgent[a.id] ?? 0,
        accepted: acceptedByAgent[a.id] ?? 0,
      }))
      .filter((r) => r.accepted > 0)
      .sort((a, b) => a.cost - b.cost);
  }, [agents, costPerAcceptedRunByAgent, acceptedByAgent]);

  return (
    <ChartCard
      title="Avg Cost per Accepted Output"
      subtitle="ROI per agent — lower is better"
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
          <YAxis tickFormatter={(v: number) => formatCurrency(v)} width={64} {...chartAxisProps} />
          <Tooltip
            {...chartTooltipProps}
            cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
            formatter={(value: number) => [formatCurrency(value), 'Avg cost / accepted']}
          />
          <Bar dataKey="cost" name="Avg cost / accepted" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {rows.map((r) => (
              <Cell key={r.id} fill={agentColors[r.id]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
