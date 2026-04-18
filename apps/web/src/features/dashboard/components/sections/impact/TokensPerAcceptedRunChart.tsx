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
import { formatCompact, formatNumber } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface TokensPerAcceptedRunChartProps {
  tokensPerAcceptedRunByAgent: Record<string, number>;
  acceptedByAgent: Record<string, number>;
  agents: Agent[];
}

export function TokensPerAcceptedRunChart({
  tokensPerAcceptedRunByAgent,
  acceptedByAgent,
  agents,
}: TokensPerAcceptedRunChartProps) {
  const agentColors = useMemo(() => buildAgentColorMap(agents), [agents]);

  const rows = useMemo(() => {
    return agents
      .map((a) => ({
        id: a.id,
        agent: a.name,
        tokens: tokensPerAcceptedRunByAgent[a.id] ?? 0,
        accepted: acceptedByAgent[a.id] ?? 0,
      }))
      .filter((r) => r.accepted > 0)
      .sort((a, b) => a.tokens - b.tokens);
  }, [agents, tokensPerAcceptedRunByAgent, acceptedByAgent]);

  return (
    <ChartCard
      title="Avg Tokens per Accepted Output"
      subtitle="Efficiency — lower token spend per accepted output"
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
            formatter={(value: number) => [formatNumber(value), 'Avg tokens / accepted']}
          />
          <Bar dataKey="tokens" name="Avg tokens / accepted" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {rows.map((r) => (
              <Cell key={r.id} fill={agentColors[r.id]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
