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
import { formatCompact, formatNumber } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface AcceptedLinesPerAgentPerDayChartProps {
  days: string[];
  /** agentId → date → accepted lines */
  data: Record<string, Record<string, number>>;
  agents: Agent[];
}

export function AcceptedLinesPerAgentPerDayChart({
  days,
  data,
  agents,
}: AcceptedLinesPerAgentPerDayChartProps) {
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
      title="Impact on Source Code by Agent"
      subtitle="Daily lines of code engineers accepted, per agent"
      empty={rows.length === 0 || activeAgents.length === 0}
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} {...chartAxisProps} />
          <YAxis tickFormatter={(v: number) => formatCompact(v)} width={48} {...chartAxisProps} />
          <Tooltip
            {...chartTooltipProps}
            labelFormatter={formatAxisDate}
            formatter={(value: number, name: string) => [formatNumber(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
          {activeAgents.map((agent) => (
            <Area
              key={agent.id}
              type="monotone"
              stackId="lines"
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
