import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import type { DashboardOutletContext } from '../DashboardPage';
import { enumerateDays } from '../../lib/dateRange';
import { useImpactAnalytics } from '../../hooks/useDashboardMetrics';
import { SectionState } from './SectionState';
import { ImpactKpis } from './impact/ImpactKpis';
import { AcceptanceRateTrendChart } from './impact/AcceptanceRateTrendChart';
import { AcceptanceRateByAgentChart } from './impact/AcceptanceRateByAgentChart';
import { AcceptedLinesPerAgentPerDayChart } from './impact/AcceptedLinesPerAgentPerDayChart';
import { AcceptedVsRejectedByAgentChart } from './impact/AcceptedVsRejectedByAgentChart';
import { GeneratedVsAcceptedLinesChart } from './impact/GeneratedVsAcceptedLinesChart';
import { CostPerAcceptedRunChart } from './impact/CostPerAcceptedRunChart';
import { TokensPerAcceptedRunChart } from './impact/TokensPerAcceptedRunChart';
import { AgentImpactTable } from './impact/AgentImpactTable';
import './impact/impact.css';

export function ImpactSection() {
  const { organizationId, dateRange } = useOutletContext<DashboardOutletContext>();
  const { data: agents = [] } = useAgents();
  const { data, isPending, error } = useImpactAnalytics({
    organizationId,
    from: dateRange.from,
    to: dateRange.to,
  });

  const days = useMemo(
    () => enumerateDays(dateRange.from, dateRange.to),
    [dateRange.from, dateRange.to],
  );

  if (isPending || error || !data) {
    return <SectionState isPending={isPending} error={error} />;
  }

  const { impact, callsPerAgent } = data;

  return (
    <div className="dashboard-section impact-section">
      <ImpactKpis impact={impact} />

      <div className="impact-chart-row-split">
        <AcceptanceRateTrendChart
          days={days}
          acceptanceRatePerDay={impact.acceptanceRatePerDay}
          acceptedPerDay={impact.acceptedPerDay}
          rejectedPerDay={impact.rejectedPerDay}
        />
        <AcceptanceRateByAgentChart
          acceptanceRateByAgent={impact.acceptanceRateByAgent}
          acceptedByAgent={impact.acceptedByAgent}
          rejectedByAgent={impact.rejectedByAgent}
          agents={agents}
        />
      </div>

      <AcceptedLinesPerAgentPerDayChart
        days={days}
        data={impact.acceptedLinesByAgentPerDay}
        agents={agents}
      />

      <div className="impact-chart-row">
        <AcceptedVsRejectedByAgentChart
          acceptedByAgent={impact.acceptedByAgent}
          rejectedByAgent={impact.rejectedByAgent}
          agents={agents}
        />
        <GeneratedVsAcceptedLinesChart
          acceptedGeneratedLinesByAgent={impact.acceptedGeneratedLinesByAgent}
          validatedLinesByAgent={impact.validatedLinesByAgent}
          acceptedLineRatio={impact.acceptedLineRatio}
          agents={agents}
        />
      </div>

      <div className="impact-chart-row">
        <CostPerAcceptedRunChart
          costPerAcceptedRunByAgent={impact.costPerAcceptedRunByAgent}
          acceptedByAgent={impact.acceptedByAgent}
          agents={agents}
        />
        <TokensPerAcceptedRunChart
          tokensPerAcceptedRunByAgent={impact.tokensPerAcceptedRunByAgent}
          acceptedByAgent={impact.acceptedByAgent}
          agents={agents}
        />
      </div>

      <AgentImpactTable impact={impact} callsPerAgent={callsPerAgent} agents={agents} />
    </div>
  );
}
