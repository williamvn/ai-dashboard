import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import type { DashboardOutletContext } from '../DashboardPage';
import { enumerateDays } from '../../lib/dateRange';
import { useUsageMetrics } from '../../hooks/useDashboardMetrics';
import { SectionState } from './SectionState';
import { UsageKpis } from './usage/UsageKpis';
import { DauOverTimeChart } from './usage/DauOverTimeChart';
import { CallsPerAgentPerDayChart } from './usage/CallsPerAgentPerDayChart';
import { CallsByAgentChart } from './usage/CallsByAgentChart';
import { UserUsageTable } from './usage/UserUsageTable';
import './usage/usage.css';

export function UsageSection() {
  const { organizationId, dateRange } = useOutletContext<DashboardOutletContext>();
  const { data: agents = [] } = useAgents();
  const query = { organizationId, from: dateRange.from, to: dateRange.to };
  const { data: usage, isPending, error } = useUsageMetrics(query);

  const days = useMemo(
    () => enumerateDays(dateRange.from, dateRange.to),
    [dateRange.from, dateRange.to],
  );

  if (isPending || error || !usage) {
    return <SectionState isPending={isPending} error={error} />;
  }

  return (
    <div className="dashboard-section usage-section">
      <UsageKpis usage={usage} windowDays={usage.windowDays} />

      <CallsPerAgentPerDayChart days={days} data={usage.callsPerAgentPerDay} agents={agents} />

      <div className="usage-chart-row">
        <DauOverTimeChart days={days} dauPerDay={usage.dauPerDay} totalUsers={usage.totalUsers} />
        <CallsByAgentChart callsPerAgent={usage.callsPerAgent} agents={agents} />
      </div>

      <UserUsageTable
        organizationId={organizationId}
        from={dateRange.from}
        to={dateRange.to}
        agents={agents}
      />
    </div>
  );
}
