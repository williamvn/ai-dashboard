import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
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
import { formatPercent } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface AcceptanceRateTrendChartProps {
  days: string[];
  acceptanceRatePerDay: Record<string, number>;
  /** Days without any validation render as gaps instead of misleading zeros. */
  acceptedPerDay: Record<string, number>;
  rejectedPerDay: Record<string, number>;
}

export function AcceptanceRateTrendChart({
  days,
  acceptanceRatePerDay,
  acceptedPerDay,
  rejectedPerDay,
}: AcceptanceRateTrendChartProps) {
  const data = useMemo(() => {
    return days.map((date) => {
      const validated = (acceptedPerDay[date] ?? 0) + (rejectedPerDay[date] ?? 0);
      return {
        date,
        rate: validated > 0 ? (acceptanceRatePerDay[date] ?? 0) * 100 : null,
      };
    });
  }, [days, acceptanceRatePerDay, acceptedPerDay, rejectedPerDay]);

  const hasData = data.some((d) => d.rate !== null);

  return (
    <ChartCard
      title="Acceptance Rate Over Time"
      subtitle="Share of reviewed outputs engineers accepted, per day"
      empty={!hasData}
    >
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} {...chartAxisProps} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            width={40}
            {...chartAxisProps}
          />
          <Tooltip
            {...chartTooltipProps}
            labelFormatter={formatAxisDate}
            formatter={(value: number | null) => [
              value === null ? '–' : formatPercent(value / 100, 1),
              'Acceptance rate',
            ]}
          />
          <Line
            type="monotone"
            dataKey="rate"
            name="Acceptance rate"
            stroke="#4ade80"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
