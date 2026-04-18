import { useMemo } from 'react';
import type { Agent } from '@repo/types';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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
  formatAxisDate,
} from '../../../lib/chartTheme';
import { formatCurrency } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface CostByAgentStackedChartProps {
  days: string[];
  /** agentId → date → cost */
  data: Record<string, Record<string, number>>;
  agents: Agent[];
}

export function CostByAgentStackedChart({ days, data, agents }: CostByAgentStackedChartProps) {
  const activeAgents = useMemo(() => {
    return agents.filter((a) => {
      const perDay = data[a.id];
      return perDay && Object.values(perDay).some((v) => v > 0);
    });
  }, [data, agents]);

  const agentColors = useMemo(() => buildAgentColorMap(agents), [agents]);

  const rows = useMemo(() => {
    return days.map((date) => {
      const row: Record<string, string | number> = { date };
      for (const a of activeAgents) row[a.id] = data[a.id]?.[date] ?? 0;
      return row;
    });
  }, [days, data, activeAgents]);

  return (
    <ChartCard
      title="Daily Cost by Agent"
      subtitle="Spend composition — total trend + contribution mix"
      empty={rows.length === 0 || activeAgents.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} {...chartAxisProps} />
          <YAxis tickFormatter={(v: number) => formatCurrency(v)} width={64} {...chartAxisProps} />
          <Tooltip
            {...chartTooltipProps}
            labelFormatter={formatAxisDate}
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
          {activeAgents.map((agent) => (
            <Area
              key={agent.id}
              type="monotone"
              stackId="cost"
              dataKey={agent.id}
              name={agent.name}
              stroke={agentColors[agent.id]}
              fill={agentColors[agent.id]}
              fillOpacity={0.35}
              strokeWidth={1.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
