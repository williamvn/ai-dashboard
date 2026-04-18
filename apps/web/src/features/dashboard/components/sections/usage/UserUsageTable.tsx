import { useMemo, useState } from 'react';
import type { Agent } from '@repo/types';
import { buildAgentColorMap } from '../../../lib/chartTheme';
import { formatNumber } from '../../../lib/format';
import { useUserRanking } from '../../../hooks/useDashboardMetrics';
import { ChartCard } from '../ChartCard';

interface UserUsageTableProps {
  organizationId: string;
  from?: string;
  to?: string;
  agents: Agent[];
}

const RANK_BY_TOTAL = 'total';

/**
 * Leaderboard of the busiest users, driven by the `/analytics/users` endpoint.
 * Swapping the agent filter refires the query with `rankBy=<agentId>`, so large
 * orgs pay for one paginated request per view rather than shipping the whole
 * roster on every dashboard load.
 */
export function UserUsageTable({ organizationId, from, to, agents }: UserUsageTableProps) {
  const [rankBy, setRankBy] = useState<string>(RANK_BY_TOTAL);
  const isTotal = rankBy === RANK_BY_TOTAL;

  const { data: rows = [], isPending, isFetching, error } = useUserRanking({
    organizationId,
    from,
    to,
    rankBy,
  });

  const agentColors = useMemo(() => buildAgentColorMap(agents), [agents]);
  const agentName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of agents) map[a.id] = a.name;
    return map;
  }, [agents]);

  const topMetric = rows[0]?.calls ?? 0;

  const headerAction = (
    <select
      className="usage-table-filter"
      value={rankBy}
      onChange={(e) => setRankBy(e.target.value)}
      disabled={isPending}
    >
      <option value={RANK_BY_TOTAL}>All agents</option>
      {agents.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );

  const subtitle = isTotal
    ? 'Bars segmented by agent — length scales to the busiest user'
    : `Users ranked by calls to ${agentName[rankBy] ?? 'agent'}`;

  return (
    <ChartCard
      title="Top Users"
      subtitle={subtitle}
      headerAction={headerAction}
      empty={!isPending && !error && rows.length === 0}
    >
      {error ? (
        <div className="usage-table-error">Failed to load ranking.</div>
      ) : isPending ? (
        <div className="usage-table-loading">Loading…</div>
      ) : (
        <div className={`usage-table${isFetching ? ' usage-table--refetching' : ''}`}>
          <div className="usage-table-head">
            <span className="usage-table-rank">#</span>
            <span className="usage-table-user">User</span>
            <span className="usage-table-calls">Calls</span>
            <span className="usage-table-bar">
              {isTotal ? 'Agent Composition' : 'Relative Volume'}
            </span>
          </div>

          {rows.map((row, i) => (
            <div key={row.userId} className="usage-table-row">
              <span className="usage-table-rank">{i + 1}</span>

              <span className="usage-table-user">
                {row.userProfilePicUrl ? (
                  <img
                    src={row.userProfilePicUrl}
                    alt=""
                    className="usage-table-avatar"
                    loading="lazy"
                  />
                ) : (
                  <span className="usage-table-avatar usage-table-avatar--fallback">
                    {row.userName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="usage-table-user-name">{row.userName}</span>
              </span>

              <span className="usage-table-calls">{formatNumber(row.calls)}</span>

              <span className="usage-table-bar">
                <span
                  className="usage-table-bar-track"
                  style={{ width: topMetric > 0 ? `${(row.calls / topMetric) * 100}%` : '0%' }}
                >
                  {isTotal ? (
                    Object.entries(row.callsByAgent)
                      .sort((a, b) => b[1] - a[1])
                      .map(([agentId, calls]) => (
                        <span
                          key={agentId}
                          className="usage-table-bar-seg"
                          style={{
                            flexGrow: calls,
                            background: agentColors[agentId] ?? 'var(--border-strong)',
                          }}
                          title={`${agentName[agentId] ?? agentId}: ${formatNumber(calls)}`}
                        />
                      ))
                  ) : (
                    <span
                      className="usage-table-bar-seg"
                      style={{
                        flexGrow: 1,
                        background: agentColors[rankBy] ?? 'var(--accent)',
                      }}
                    />
                  )}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
