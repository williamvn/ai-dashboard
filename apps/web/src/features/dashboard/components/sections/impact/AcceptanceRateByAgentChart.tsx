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
import { formatNumber, formatPercent } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface AcceptanceRateByAgentChartProps {
  acceptanceRateByAgent: Record<string, number>;
  acceptedByAgent: Record<string, number>;
  rejectedByAgent: Record<string, number>;
  agents: Agent[];
}

interface Row {
  id: string;
  agent: string;
  rate: number;
  validated: number;
}

export function AcceptanceRateByAgentChart({
  acceptanceRateByAgent,
  acceptedByAgent,
  rejectedByAgent,
  agents,
}: AcceptanceRateByAgentChartProps) {
  const agentColors = useMemo(() => buildAgentColorMap(agents), [agents]);

  const rows = useMemo<Row[]>(() => {
    return agents
      .map((a) => {
        const accepted = acceptedByAgent[a.id] ?? 0;
        const rejected = rejectedByAgent[a.id] ?? 0;
        return {
          id: a.id,
          agent: a.name,
          rate: (acceptanceRateByAgent[a.id] ?? 0) * 100,
          validated: accepted + rejected,
        };
      })
      .filter((r) => r.validated > 0)
      .sort((a, b) => b.rate - a.rate);
  }, [agents, acceptanceRateByAgent, acceptedByAgent, rejectedByAgent]);

  return (
    <ChartCard
      title="Acceptance Rate by Agent"
      subtitle="Share of reviewed outputs engineers accepted, per agent"
      empty={rows.length === 0}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid {...chartGridProps} horizontal={false} vertical />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            {...chartAxisProps}
          />
          <YAxis
            type="category"
            dataKey="agent"
            width={120}
            {...chartAxisProps}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <Tooltip
            {...chartTooltipProps}
            cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
            formatter={(value: number, _name: string, entry: { payload?: Row }) => {
              const row = entry?.payload;
              return [
                `${formatPercent(value / 100, 1)} (${formatNumber(row?.validated ?? 0)} reviewed outputs)`,
                'Acceptance rate',
              ];
            }}
          />
          <Bar dataKey="rate" name="Acceptance rate" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {rows.map((r) => (
              <Cell key={r.id} fill={agentColors[r.id]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
