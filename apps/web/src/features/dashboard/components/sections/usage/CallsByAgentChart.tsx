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
import { ChartCard } from './ChartCard';

interface CallsByAgentChartProps {
  callsPerAgent: Record<string, number>;
  agents: Agent[];
}

export function CallsByAgentChart({ callsPerAgent, agents }: CallsByAgentChartProps) {
  const agentColors = useMemo(() => buildAgentColorMap(agents), [agents]);

  const rows = useMemo(() => {
    return agents
      .map((a) => ({
        id: a.id,
        agent: a.name,
        calls: callsPerAgent[a.id] ?? 0,
      }))
      .filter((r) => r.calls > 0)
      .sort((a, b) => b.calls - a.calls);
  }, [agents, callsPerAgent]);

  return (
    <ChartCard title="Most Used Agents" empty={rows.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis
            dataKey="agent"
            interval={0}
            {...chartAxisProps}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis allowDecimals={false} {...chartAxisProps} />
          <Tooltip {...chartTooltipProps} cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }} />
          <Bar dataKey="calls" name="Calls" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {rows.map((r) => (
              <Cell key={r.id} fill={agentColors[r.id]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
