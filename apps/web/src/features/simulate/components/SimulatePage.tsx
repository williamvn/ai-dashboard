import { Navigate } from 'react-router-dom';
import { useOrgUsers } from '../hooks/useOrgUsers';
import { useAgents } from '@/hooks/useAgents';
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations';
import { useSimulation } from '../hooks/useSimulation';
import { useSimulationConfig } from '../hooks/useSimulationConfig';
import { buildEngineerConfigs } from '../services/simulate.service';
import { Spinner } from '@/components/ui/Spinner';
import { GlobalDefaultsPanel } from './GlobalDefaultsPanel';
import { EngineerList } from './EngineerList';
import { SimulateRunBar } from './SimulateRunBar';
import { SimulateResults } from './SimulateResults';
import { SimulateBlockerModal } from './SimulateBlockerModal';
import '../simulate.css';

interface SimulatePageProps {
  orgId: string;
}

export function SimulatePage({ orgId }: SimulatePageProps) {
  const { data: orgs } = useOrganizations();
  const { data: users = [], isLoading: loadingUsers, error: usersError } = useOrgUsers(orgId);
  const { data: agents = [], isLoading: loadingAgents } = useAgents();

  const org = orgs?.find((o) => o.id === orgId);
  const config = useSimulationConfig({ users, agents });
  const sim = useSimulation();

  async function handleRun() {
    const { selectedUsers, overrides } = config.engineers;
    if (selectedUsers.length === 0 || config.globals.agentIds.length === 0) return;

    await sim.handleRun({
      engineers: buildEngineerConfigs(selectedUsers, overrides, config.globals),
      days: config.globals.days,
    });
  }

  const canRun =
    config.engineers.selectedUsers.length > 0 && config.globals.agentIds.length > 0;
  const isLoading = loadingUsers || loadingAgents;

  if (usersError?.message.includes('404')) return <Navigate to="/" replace />;

  return (
    <div className="simulate-page">
      <SimulateBlockerModal blocker={sim.blocker} onAbort={sim.handleStop} />

      <div className="simulate-header">
        <div>
          <h1 className="simulate-title">Simulate Usage</h1>
          <p className="simulate-subtitle">
            Generate synthetic AI agent activity for <strong>{org?.name ?? '…'}</strong>
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="simulate-loading">
          <Spinner />
        </div>
      ) : (
        <div className={`simulate-body${sim.running ? ' simulate-body--locked' : ''}`}>
          <GlobalDefaultsPanel
            globals={config.globals}
            allAgentsSelected={config.allAgentsSelected}
            actions={config.globalsActions}
            agents={agents}
            running={sim.running}
          />
          <EngineerList
            users={users}
            agents={agents}
            engineers={config.engineers}
            actions={config.engineersActions}
            globals={config.globals}
            running={sim.running}
          />
        </div>
      )}

      {!isLoading && (
        <SimulateRunBar
          estimatedCalls={config.engineers.estimatedCalls}
          running={sim.running}
          progress={sim.progress}
          progressPct={sim.progressPct}
          canRun={canRun}
          onRun={() => void handleRun()}
          onStop={sim.handleStop}
        />
      )}

      {sim.error && <p className="error-text" style={{ padding: '0 24px 16px' }}>{sim.error}</p>}

      <SimulateResults result={sim.result} />
    </div>
  );
}
