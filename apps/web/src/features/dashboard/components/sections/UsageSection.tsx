import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import type { DashboardOutletContext } from '../DashboardPage';
import { enumerateDays } from '../../lib/dateRange';
import { UsageKpis } from './usage/UsageKpis';
import { CallsOverTimeChart } from './usage/CallsOverTimeChart';
import { DauOverTimeChart } from './usage/DauOverTimeChart';
import { CallsPerAgentPerDayChart } from './usage/CallsPerAgentPerDayChart';
import { CallsByAgentChart } from './usage/CallsByAgentChart';
import './usage/usage.css';

export function UsageSection() {
  const { metrics, dateRange } = useOutletContext<DashboardOutletContext>();
  const { data: agents = [] } = useAgents();
  const usage = metrics.usage;

  const days = useMemo(
    () => enumerateDays(dateRange.from, dateRange.to),
    [dateRange.from, dateRange.to],
  );

  return (
    <div className="dashboard-section usage-section">
      <UsageKpis usage={usage} windowDays={days.length} />

      <div className="usage-chart-row">
        <CallsOverTimeChart days={days} callsPerDay={usage.callsPerDay} />
        <DauOverTimeChart days={days} dauPerDay={usage.dauPerDay} totalUsers={usage.totalUsers} />
      </div>

      <CallsPerAgentPerDayChart
        days={days}
        data={usage.callsPerAgentPerDay}
        agents={agents}
      />

      <CallsByAgentChart callsPerAgent={usage.callsPerAgent} agents={agents} />
    </div>
  );
}
