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

interface CostByAgentChartProps {
  costByAgent: Record<string, number>;
  agents: Agent[];
}

export function CostByAgentChart({ costByAgent, agents }: CostByAgentChartProps) {
  const agentColors = useMemo(() => buildAgentColorMap(agents), [agents]);

  const rows = useMemo(() => {
    return agents
      .map((a) => ({ id: a.id, agent: a.name, cost: costByAgent[a.id] ?? 0 }))
      .filter((r) => r.cost > 0)
      .sort((a, b) => b.cost - a.cost);
  }, [agents, costByAgent]);

  return (
    <ChartCard title="Total Cost per Agent" empty={rows.length === 0}>
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
            formatter={(value: number) => [formatCurrency(value), 'Cost']}
          />
          <Bar dataKey="cost" name="Cost" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {rows.map((r) => (
              <Cell key={r.id} fill={agentColors[r.id]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
