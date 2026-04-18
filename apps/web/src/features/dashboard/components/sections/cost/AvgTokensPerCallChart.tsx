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
import { formatCompact } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface AvgTokensPerCallChartProps {
  avgTokensPerRunByAgent: Record<string, number>;
  agents: Agent[];
}

export function AvgTokensPerCallChart({ avgTokensPerRunByAgent, agents }: AvgTokensPerCallChartProps) {
  const agentColors = useMemo(() => buildAgentColorMap(agents), [agents]);

  const rows = useMemo(() => {
    return agents
      .map((a) => ({ id: a.id, agent: a.name, tokens: avgTokensPerRunByAgent[a.id] ?? 0 }))
      .filter((r) => r.tokens > 0)
      .sort((a, b) => b.tokens - a.tokens);
  }, [agents, avgTokensPerRunByAgent]);

  return (
    <ChartCard
      title="Avg Tokens per Call"
      subtitle="Volume per invocation"
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
          <YAxis tickFormatter={(v: number) => formatCompact(v)} width={56} {...chartAxisProps} />
          <Tooltip
            {...chartTooltipProps}
            cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
            formatter={(value: number) => [formatCompact(value), 'Avg / call']}
          />
          <Bar dataKey="tokens" name="Avg / call" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {rows.map((r) => (
              <Cell key={r.id} fill={agentColors[r.id]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
