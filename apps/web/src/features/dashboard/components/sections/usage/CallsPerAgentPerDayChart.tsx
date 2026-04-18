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
import { ChartCard } from '../ChartCard';

interface CallsPerAgentPerDayChartProps {
  days: string[];
  data: Record<string, Record<string, number>>;
  agents: Agent[];
}

/**
 * Stacked area chart: the outer envelope reads as total calls per day, and the
 * colored bands reveal the per-agent composition — more legible than 5+ overlaid
 * lines once adoption spreads across agents.
 */
export function CallsPerAgentPerDayChart({ days, data, agents }: CallsPerAgentPerDayChartProps) {
  const activeAgents = useMemo(() => {
    const seen = new Set<string>();
    for (const perAgent of Object.values(data)) {
      for (const id of Object.keys(perAgent)) seen.add(id);
    }
    return agents.filter((a) => seen.has(a.id));
  }, [data, agents]);

  const agentColors = useMemo(() => buildAgentColorMap(agents), [agents]);

  const rows = useMemo(() => {
    return days.map((date) => {
      const perAgent = data[date] ?? {};
      const row: Record<string, string | number> = { date };
      for (const a of activeAgents) row[a.id] = perAgent[a.id] ?? 0;
      return row;
    });
  }, [days, data, activeAgents]);

  return (
    <ChartCard
      title="Calls Per Agent Over Time"
      subtitle="Stacked — envelope = total calls, bands = per-agent share"
      empty={rows.length === 0 || activeAgents.length === 0}
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} {...chartAxisProps} />
          <YAxis allowDecimals={false} {...chartAxisProps} />
          <Tooltip {...chartTooltipProps} labelFormatter={formatAxisDate} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          {activeAgents.map((agent) => (
            <Area
              key={agent.id}
              type="monotone"
              dataKey={agent.id}
              name={agent.name}
              stackId="calls"
              stroke={agentColors[agent.id]}
              strokeWidth={1}
              fill={agentColors[agent.id]}
              fillOpacity={0.55}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
