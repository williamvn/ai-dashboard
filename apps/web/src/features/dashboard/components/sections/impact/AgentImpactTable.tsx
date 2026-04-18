import { useMemo, useState } from 'react';
import type { Agent, ImpactMetrics } from '@repo/types';
import { buildAgentColorMap } from '../../../lib/chartTheme';
import {
  formatCompact,
  formatCurrency,
  formatDecimal,
  formatNumber,
  formatPercent,
} from '../../../lib/format';
import { ChartCard } from '../ChartCard';

type SortKey =
  | 'acceptanceRate'
  | 'calls'
  | 'validated'
  | 'avgLines'
  | 'costPerAccepted'
  | 'tokensPerAccepted';
type SortDir = 'desc' | 'asc';

interface AgentImpactTableProps {
  impact: ImpactMetrics;
  callsPerAgent: Record<string, number>;
  agents: Agent[];
}

interface Row {
  id: string;
  name: string;
  color: string;
  calls: number;
  accepted: number;
  rejected: number;
  validated: number;
  acceptanceRate: number;
  validatedLines: number;
  avgLines: number;
  costPerAccepted: number;
  tokensPerAccepted: number;
}

export function AgentImpactTable({ impact, callsPerAgent, agents }: AgentImpactTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('acceptanceRate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const rows = useMemo<Row[]>(() => {
    const colors = buildAgentColorMap(agents);
    return agents
      .map((a) => {
        const accepted = impact.acceptedByAgent[a.id] ?? 0;
        const rejected = impact.rejectedByAgent[a.id] ?? 0;
        const validatedLines = impact.validatedLinesByAgent[a.id] ?? 0;
        return {
          id: a.id,
          name: a.name,
          color: colors[a.id] ?? '#94a3b8',
          calls: callsPerAgent[a.id] ?? 0,
          accepted,
          rejected,
          validated: accepted + rejected,
          acceptanceRate: impact.acceptanceRateByAgent[a.id] ?? 0,
          validatedLines,
          avgLines: accepted > 0 ? validatedLines / accepted : 0,
          costPerAccepted: impact.costPerAcceptedRunByAgent[a.id] ?? 0,
          tokensPerAccepted: impact.tokensPerAcceptedRunByAgent[a.id] ?? 0,
        };
      })
      .filter((r) => r.calls > 0);
  }, [agents, impact, callsPerAgent]);

  const sorted = useMemo(() => {
    const factor = sortDir === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => (a[sortKey] - b[sortKey]) * factor);
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <ChartCard
      title="Agent Impact Leaderboard"
      subtitle="Per-agent output quality and ROI at a glance — all rates and costs are averages across the window"
      empty={sorted.length === 0}
    >
      <div className="agent-impact-scroll">
        <table className="agent-impact-table">
          <thead>
            <tr>
              <th className="rank-col">#</th>
              <th>Agent</th>
              <SortHeader
                label="Outputs"
                active={sortKey === 'calls'}
                direction={sortDir}
                onClick={() => handleSort('calls')}
              />
              <SortHeader
                label="Reviewed"
                active={sortKey === 'validated'}
                direction={sortDir}
                onClick={() => handleSort('validated')}
              />
              <SortHeader
                label="Acceptance"
                active={sortKey === 'acceptanceRate'}
                direction={sortDir}
                onClick={() => handleSort('acceptanceRate')}
              />
              <SortHeader
                label="Avg LOC / Accepted"
                active={sortKey === 'avgLines'}
                direction={sortDir}
                onClick={() => handleSort('avgLines')}
              />
              <SortHeader
                label="Avg Cost / Accepted"
                active={sortKey === 'costPerAccepted'}
                direction={sortDir}
                onClick={() => handleSort('costPerAccepted')}
              />
              <SortHeader
                label="Avg Tokens / Accepted"
                active={sortKey === 'tokensPerAccepted'}
                direction={sortDir}
                onClick={() => handleSort('tokensPerAccepted')}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => (
              <tr key={r.id}>
                <td className="rank-col">{idx + 1}</td>
                <td>
                  <div className="agent-cell">
                    <span className="agent-impact-dot" style={{ background: r.color }} aria-hidden />
                    <span className="agent-impact-name">{r.name}</span>
                  </div>
                </td>
                <td>{formatNumber(r.calls)}</td>
                <td>
                  {r.validated > 0 ? (
                    formatNumber(r.validated)
                  ) : (
                    <span className="agent-impact-muted">–</span>
                  )}
                </td>
                <td className="agent-impact-rate">
                  {r.validated > 0 ? (
                    formatPercent(r.acceptanceRate)
                  ) : (
                    <span className="agent-impact-muted">–</span>
                  )}
                </td>
                <td>
                  {r.accepted > 0 ? (
                    formatDecimal(r.avgLines, 1)
                  ) : (
                    <span className="agent-impact-muted">–</span>
                  )}
                </td>
                <td>
                  {r.accepted > 0 ? (
                    formatCurrency(r.costPerAccepted)
                  ) : (
                    <span className="agent-impact-muted">–</span>
                  )}
                </td>
                <td>
                  {r.accepted > 0 ? (
                    formatCompact(r.tokensPerAccepted)
                  ) : (
                    <span className="agent-impact-muted">–</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDir;
  onClick: () => void;
}) {
  return (
    <th>
      <button
        type="button"
        className={`agent-impact-sort${active ? ' is-active' : ''}`}
        onClick={onClick}
        aria-sort={active ? (direction === 'desc' ? 'descending' : 'ascending') : 'none'}
      >
        {label}
        <span className="agent-impact-sort-arrow" aria-hidden>
          {active ? (direction === 'desc' ? '▼' : '▲') : '↕'}
        </span>
      </button>
    </th>
  );
}
