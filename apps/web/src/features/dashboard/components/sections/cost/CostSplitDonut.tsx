import { useMemo } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from '../../../lib/recharts';
import { chartTooltipProps } from '../../../lib/chartTheme';
import { formatCurrency } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

interface CostSplitDonutProps {
  inputCost: number;
  outputCost: number;
}

const COLORS = {
  input: '#22d3ee',
  output: '#f472b6',
};

export function CostSplitDonut({ inputCost, outputCost }: CostSplitDonutProps) {
  const total = inputCost + outputCost;
  const data = useMemo(
    () => [
      { name: 'Input tokens', value: inputCost, color: COLORS.input },
      { name: 'Output tokens', value: outputCost, color: COLORS.output },
    ],
    [inputCost, outputCost],
  );

  const inputPct = total > 0 ? (inputCost / total) * 100 : 0;
  const outputPct = total > 0 ? (outputCost / total) * 100 : 0;

  return (
    <ChartCard
      title="Input vs Output Spend"
      subtitle="Where does the money go?"
      empty={total === 0}
    >
      <div className="cost-split-layout">
        <div className="cost-split-chart">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
                stroke="var(--bg-surface)"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                {...chartTooltipProps}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="cost-split-legend">
          <LegendRow label="Input tokens" color={COLORS.input} value={inputCost} pct={inputPct} />
          <LegendRow label="Output tokens" color={COLORS.output} value={outputCost} pct={outputPct} />
        </div>
      </div>
    </ChartCard>
  );
}

function LegendRow({ label, color, value, pct }: { label: string; color: string; value: number; pct: number }) {
  return (
    <div className="cost-split-legend-row">
      <span className="cost-split-legend-dot" style={{ backgroundColor: color }} />
      <div className="cost-split-legend-text">
        <span className="cost-split-legend-label">{label}</span>
        <span className="cost-split-legend-value">
          {formatCurrency(value)} <span className="cost-split-legend-pct">({pct.toFixed(1)}%)</span>
        </span>
      </div>
    </div>
  );
}
