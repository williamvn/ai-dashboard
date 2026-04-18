import { useMemo } from 'react';
import type { Agent } from '@repo/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../../../lib/recharts';
import {
  chartAxisProps,
  chartGridProps,
  chartTooltipProps,
} from '../../../lib/chartTheme';
import { formatCompact } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface TokensByAgentChartProps {
  inputTokensByAgent: Record<string, number>;
  outputTokensByAgent: Record<string, number>;
  agents: Agent[];
}

// Blue = information flowing in, pink = generation flowing out. The split makes
// it obvious whether an agent is context-heavy (reviewer) or output-heavy (codegen).
const INPUT_COLOR = '#22d3ee';
const OUTPUT_COLOR = '#f472b6';

export function TokensByAgentChart({
  inputTokensByAgent,
  outputTokensByAgent,
  agents,
}: TokensByAgentChartProps) {
  const rows = useMemo(() => {
    return agents
      .map((a) => {
        const input = inputTokensByAgent[a.id] ?? 0;
        const output = outputTokensByAgent[a.id] ?? 0;
        return { id: a.id, agent: a.name, input, output, total: input + output };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [agents, inputTokensByAgent, outputTokensByAgent]);

  return (
    <ChartCard
      title="Total Tokens per Agent"
      subtitle="Input vs output breakdown"
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
            formatter={(value: number, name: string) => [formatCompact(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
          <Bar dataKey="input" name="Input" stackId="tokens" fill={INPUT_COLOR} maxBarSize={64} />
          <Bar
            dataKey="output"
            name="Output"
            stackId="tokens"
            fill={OUTPUT_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={64}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
