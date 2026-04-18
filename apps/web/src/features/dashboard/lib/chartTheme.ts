// Shared recharts styling so every chart in the dashboard reads consistent.
// Values reference CSS custom properties — resolved at paint time, themeable.

import type { Agent } from '@repo/types';

export const AGENT_PALETTE = [
  '#818cf8', // indigo-400
  '#22d3ee', // cyan-400
  '#f59e0b', // amber-500
  '#f472b6', // pink-400
  '#4ade80', // green-400
  '#f87171', // red-400
  '#a78bfa', // violet-400
  '#2dd4bf', // teal-400
];

export function colorForIndex(i: number): string {
  return AGENT_PALETTE[i % AGENT_PALETTE.length]!;
}

/**
 * Map each agent to a stable palette color based on its position in the canonical
 * agents list. Both the per-agent-over-time chart and the most-used-agents bar chart
 * read from this map so the same agent always wears the same color.
 */
export function buildAgentColorMap(agents: Agent[]): Record<string, string> {
  const map: Record<string, string> = {};
  agents.forEach((a, i) => {
    map[a.id] = colorForIndex(i);
  });
  return map;
}

export const chartAxisProps = {
  stroke: 'var(--border-strong)',
  tick: { fill: 'var(--text-tertiary)', fontSize: 11 },
  tickLine: false,
};

export const chartGridProps = {
  stroke: 'var(--border)',
  strokeDasharray: '3 3',
  vertical: false as const,
};

export const chartTooltipProps = {
  contentStyle: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontSize: 12,
    padding: '8px 10px',
  },
  labelStyle: { color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 },
  itemStyle: { color: 'var(--text-primary)', padding: 0 },
  cursor: { stroke: 'var(--border-strong)', strokeWidth: 1 },
};

export function formatAxisDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
