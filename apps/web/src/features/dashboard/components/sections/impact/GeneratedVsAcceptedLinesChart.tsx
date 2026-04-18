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
import { formatCompact, formatNumber, formatPercent } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

const GENERATED_COLOR = '#64748b';
const ACCEPTED_COLOR = '#4ade80';

interface GeneratedVsAcceptedLinesChartProps {
  /** agentId → lines generated on accepted runs only. Same population as
   * validatedLinesByAgent so the two bars are apples-to-apples. */
  acceptedGeneratedLinesByAgent: Record<string, number>;
  validatedLinesByAgent: Record<string, number>;
  /** Overall share of accepted-run generated code that engineers kept (0–1). */
  acceptedLineRatio: number;
  agents: Agent[];
}

export function GeneratedVsAcceptedLinesChart({
  acceptedGeneratedLinesByAgent,
  validatedLinesByAgent,
  acceptedLineRatio,
  agents,
}: GeneratedVsAcceptedLinesChartProps) {
  const rows = useMemo(() => {
    return agents
      .map((a) => ({
        id: a.id,
        agent: a.name,
        generated: acceptedGeneratedLinesByAgent[a.id] ?? 0,
        accepted: validatedLinesByAgent[a.id] ?? 0,
      }))
      .filter((r) => r.generated > 0)
      .sort((a, b) => b.generated - a.generated);
  }, [agents, acceptedGeneratedLinesByAgent, validatedLinesByAgent]);

  const hasData = rows.length > 0;
  const subtitle = hasData
    ? `Within accepted outputs — engineers kept ${formatPercent(acceptedLineRatio)} of generated code overall`
    : 'Within accepted outputs — generated vs accepted LOC per agent';

  return (
    <ChartCard
      title="Generated vs Accepted Lines of Code"
      subtitle={subtitle}
      empty={!hasData}
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
          <YAxis tickFormatter={(v: number) => formatCompact(v)} width={48} {...chartAxisProps} />
          <Tooltip
            {...chartTooltipProps}
            cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
            formatter={(value: number, name: string) => [formatNumber(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
          <Bar
            dataKey="generated"
            name="Generated"
            fill={GENERATED_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="accepted"
            name="Accepted"
            fill={ACCEPTED_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
