import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import type { DashboardOutletContext } from '../DashboardPage';
import { enumerateDays } from '../../lib/dateRange';
import { useCostAnalytics } from '../../hooks/useDashboardMetrics';
import { SectionState } from './SectionState';
import { CostKpis } from './cost/CostKpis';
import { CostOverTimeChart } from './cost/CostOverTimeChart';
import { CostSplitDonut } from './cost/CostSplitDonut';
import { CostByAgentStackedChart } from './cost/CostByAgentStackedChart';
import { CostByAgentChart } from './cost/CostByAgentChart';
import { AvgCostPerCallChart } from './cost/AvgCostPerCallChart';
import { TokensPerAgentPerDayChart } from './cost/TokensPerAgentPerDayChart';
import { TokensByAgentChart } from './cost/TokensByAgentChart';
import { AvgTokensPerCallChart } from './cost/AvgTokensPerCallChart';
import { LatencyByAgentChart } from './cost/LatencyByAgentChart';
import { UserRankingTable } from './cost/UserRankingTable';
import { CallsByAgentChart } from './usage/CallsByAgentChart';
import './cost/cost.css';

export function CostSection() {
  const { organizationId, dateRange } = useOutletContext<DashboardOutletContext>();
  const { data: agents = [] } = useAgents();
  const { data, isPending, error } = useCostAnalytics({
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

  const { windowDays, cost, tokens, latency, userRanking, callsPerAgent } = data;

  return (
    <div className="dashboard-section cost-section">
      <CostKpis cost={cost} tokens={tokens} latency={latency} windowDays={windowDays} />

      <div className="cost-chart-row-split">
        <CostOverTimeChart days={days} costPerDay={cost.costPerDay} />
        <CostSplitDonut inputCost={cost.inputCost} outputCost={cost.outputCost} />
      </div>

      <CostByAgentStackedChart days={days} data={cost.costByAgentPerDay} agents={agents} />

      <div className="cost-chart-row">
        <CostByAgentChart costByAgent={cost.costByAgent} agents={agents} />
        <CallsByAgentChart callsPerAgent={callsPerAgent} agents={agents} />
      </div>

      <div className="cost-chart-row">
        <AvgCostPerCallChart avgCostPerRunByAgent={cost.avgCostPerRunByAgent} agents={agents} />
        <AvgTokensPerCallChart avgTokensPerRunByAgent={tokens.avgTokensPerRunByAgent} agents={agents} />
      </div>

      <div className="cost-chart-row">
        <TokensPerAgentPerDayChart days={days} data={tokens.tokensByAgentPerDay} agents={agents} />
        <TokensByAgentChart
          inputTokensByAgent={tokens.inputTokensByAgent}
          outputTokensByAgent={tokens.outputTokensByAgent}
          agents={agents}
        />
      </div>

      <LatencyByAgentChart latency={latency} agents={agents} />

      <UserRankingTable users={userRanking} />
    </div>
  );
}
