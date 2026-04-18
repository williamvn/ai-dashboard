import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../../../lib/recharts';
import {
  chartAxisProps,
  chartGridProps,
  chartTooltipProps,
  formatAxisDate,
} from '../../../lib/chartTheme';
import { ChartCard } from '../ChartCard';

interface DauOverTimeChartProps {
  days: string[];
  dauPerDay: Record<string, number>;
  totalUsers: number;
}

export function DauOverTimeChart({ days, dauPerDay, totalUsers }: DauOverTimeChartProps) {
  const data = useMemo(
    () => days.map((date) => ({ date, dau: dauPerDay[date] ?? 0 })),
    [days, dauPerDay],
  );

  return (
    <ChartCard
      title="Daily Active Users"
      subtitle={totalUsers > 0 ? `out of ${totalUsers} total` : undefined}
      empty={data.length === 0}
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="dauFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} {...chartAxisProps} />
          <YAxis allowDecimals={false} domain={[0, totalUsers || 'auto']} {...chartAxisProps} />
          <Tooltip {...chartTooltipProps} labelFormatter={formatAxisDate} />
          <Area
            type="monotone"
            dataKey="dau"
            name="DAU"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#dauFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
