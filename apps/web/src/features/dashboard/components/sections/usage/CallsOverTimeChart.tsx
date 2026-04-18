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
import { ChartCard } from '../ChartCard';

interface CallsOverTimeChartProps {
  days: string[];
  callsPerDay: Record<string, number>;
}

export function CallsOverTimeChart({ days, callsPerDay }: CallsOverTimeChartProps) {
  const data = useMemo(
    () => days.map((date) => ({ date, calls: callsPerDay[date] ?? 0 })),
    [days, callsPerDay],
  );

  return (
    <ChartCard title="Calls Per Day" empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} {...chartAxisProps} />
          <YAxis allowDecimals={false} {...chartAxisProps} />
          <Tooltip {...chartTooltipProps} labelFormatter={formatAxisDate} />
          <Line
            type="monotone"
            dataKey="calls"
            name="Calls"
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
