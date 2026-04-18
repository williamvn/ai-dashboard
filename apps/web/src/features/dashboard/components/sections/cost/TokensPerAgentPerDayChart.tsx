import { useMemo } from 'react';
import type { Agent } from '@repo/types';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import { formatCompact } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface TokensPerAgentPerDayChartProps {
  days: string[];
  /** agentId → date → tokens */
  data: Record<string, Record<string, number>>;
  agents: Agent[];
}

export function TokensPerAgentPerDayChart({ days, data, agents }: TokensPerAgentPerDayChartProps) {
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
      title="Daily Tokens by Agent"
      subtitle="Token volume over time"
      empty={rows.length === 0 || activeAgents.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} {...chartAxisProps} />
          <YAxis tickFormatter={(v: number) => formatCompact(v)} width={56} {...chartAxisProps} />
          <Tooltip
            {...chartTooltipProps}
            labelFormatter={formatAxisDate}
            formatter={(value: number, name: string) => [formatCompact(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
          {activeAgents.map((agent) => (
            <Line
              key={agent.id}
              type="monotone"
              dataKey={agent.id}
              name={agent.name}
              stroke={agentColors[agent.id]}
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
