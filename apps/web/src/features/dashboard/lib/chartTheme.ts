// Shared recharts styling so every chart in the dashboard reads consistent.
// Values reference CSS custom properties — resolved at paint time, themeable.

import type { Agent } from '@repo/types';

// Reds are intentionally excluded — reserved for --danger-* (stop buttons, errors).
export const AGENT_PALETTE = [
  '#818cf8', // indigo-400
  '#22d3ee', // cyan-400
  '#f59e0b', // amber-500
  '#f472b6', // pink-400
  '#4ade80', // green-400
  '#a3e635', // lime-400
  '#fb923c', // orange-400
  '#2dd4bf', // teal-400
];

/** djb2 hash — stable across reorderings, used as the preferred palette slot. */
function hashToSlot(id: string, slots: number): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return Math.abs(h) % slots;
}

/**
 * Stable, collision-free while |agents| ≤ |palette|. Each agent is assigned its
 * hashed slot; if that slot is already taken, linear-probe to the next free one.
 * Once the palette is exhausted, later agents simply fall back to the hashed slot
 * and accept collisions. Agents are processed in a stable order (sorted by id) so
 * the assignment doesn't depend on the incoming array order.
 */
export function buildAgentColorMap(agents: Agent[]): Record<string, string> {
  const slots = AGENT_PALETTE.length;
  const ordered = [...agents].sort((a, b) => a.id.localeCompare(b.id));
  const taken = new Set<number>();
  const map: Record<string, string> = {};

  for (const a of ordered) {
    const preferred = hashToSlot(a.id, slots);
    let slot = preferred;
    if (taken.size < slots) {
      while (taken.has(slot)) slot = (slot + 1) % slots;
      taken.add(slot);
    }
    map[a.id] = AGENT_PALETTE[slot]!;
  }

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
