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
import { ChartCard } from './ChartCard';

interface CallsPerAgentPerDayChartProps {
  days: string[];
  data: Record<string, Record<string, number>>;
  agents: Agent[];
}

export function CallsPerAgentPerDayChart({ days, data, agents }: CallsPerAgentPerDayChartProps) {
  // Only render series for agents that had at least one call in the window —
  // a chart with 8 flat-zero lines is visual noise.
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
    <ChartCard title="Calls Per Agent" empty={rows.length === 0 || activeAgents.length === 0}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
