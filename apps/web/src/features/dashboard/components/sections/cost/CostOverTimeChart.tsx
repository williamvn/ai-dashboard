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
import { formatCurrency } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface CostOverTimeChartProps {
  days: string[];
  costPerDay: Record<string, number>;
}

export function CostOverTimeChart({ days, costPerDay }: CostOverTimeChartProps) {
  const data = useMemo(
    () => days.map((date) => ({ date, cost: costPerDay[date] ?? 0 })),
    [days, costPerDay],
  );

  return (
    <ChartCard title="Daily Cost" subtitle="Total spend per day" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} {...chartAxisProps} />
          <YAxis tickFormatter={(v: number) => formatCurrency(v)} width={64} {...chartAxisProps} />
          <Tooltip
            {...chartTooltipProps}
            labelFormatter={formatAxisDate}
            formatter={(value: number) => [formatCurrency(value), 'Cost']}
          />
          <Line
            type="monotone"
            dataKey="cost"
            name="Cost"
            stroke="#818cf8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
