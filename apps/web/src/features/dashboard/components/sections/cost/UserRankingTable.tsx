import { useMemo, useState } from 'react';
import type { UserCostRanking } from '@repo/types';
import { formatCompact, formatCurrency, formatNumber } from '../../../lib/format';
import { ChartCard } from '../ChartCard';

// Cost is the table's reason for existing — the backend already orders by cost
// desc, so offering "sort by cost" again would be redundant. Only the other
// dimensions get an interactive header.
type SortKey = 'totalCalls' | 'totalTokens';
type SortDir = 'desc' | 'asc';

interface UserRankingTableProps {
  users: UserCostRanking[];
}

export function UserRankingTable({ users }: UserRankingTableProps) {
  // null = preserve backend order (cost desc).
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    if (sortKey === null) return users;
    const factor = sortDir === 'desc' ? -1 : 1;
    return [...users].sort((a, b) => (a[sortKey] - b[sortKey]) * factor);
  }, [users, sortKey, sortDir]);

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
      title="Top Users by Spend"
      subtitle={`Top ${users.length} users in selected window`}
      empty={users.length === 0}
    >
      <div className="user-ranking-scroll">
        <table className="user-ranking-table">
          <thead>
            <tr>
              <th className="rank-col">#</th>
              <th>User</th>
              <SortHeader
                label="Total Calls"
                active={sortKey === 'totalCalls'}
                direction={sortDir}
                onClick={() => handleSort('totalCalls')}
              />
              <th>Total Cost</th>
              <SortHeader
                label="Total Tokens"
                active={sortKey === 'totalTokens'}
                direction={sortDir}
                onClick={() => handleSort('totalTokens')}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.map((u, idx) => (
              <tr key={u.userId}>
                <td className="rank-col">{idx + 1}</td>
                <td>
                  <div className="user-cell">
                    {u.userProfilePicUrl ? (
                      <img
                        className="user-avatar"
                        src={u.userProfilePicUrl}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className="user-avatar user-avatar-placeholder" aria-hidden />
                    )}
                    <span className="user-name">{u.userName}</span>
                  </div>
                </td>
                <td>{formatNumber(u.totalCalls)}</td>
                <td>{formatCurrency(u.totalCost)}</td>
                <td>{formatCompact(u.totalTokens)}</td>
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
        className={`user-ranking-sort${active ? ' is-active' : ''}`}
        onClick={onClick}
        aria-sort={active ? (direction === 'desc' ? 'descending' : 'ascending') : 'none'}
      >
        {label}
        <span className="user-ranking-sort-arrow" aria-hidden>
          {active ? (direction === 'desc' ? '▼' : '▲') : '↕'}
        </span>
      </button>
    </th>
  );
}
