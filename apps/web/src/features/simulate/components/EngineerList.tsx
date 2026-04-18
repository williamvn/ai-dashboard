import { memo } from 'react';
import type { User, Agent } from '@repo/types';
import type { EngineersActions, EngineersState, Globals } from '../types';
import { EngineerRow } from './EngineerRow';

interface EngineerListProps {
  users: User[];
  agents: Agent[];
  engineers: EngineersState;
  actions: EngineersActions;
  globals: Globals;
  running: boolean;
}

function EngineerListBase({
  users,
  agents,
  engineers,
  actions,
  globals,
  running,
}: EngineerListProps) {
  const { selectedUserIds, overrides, expandedUserId, allUsersSelected, customisedCount } = engineers;

  return (
    <div className="simulate-users">
      <div className="config-label-row" style={{ marginBottom: 8 }}>
        <h2 className="config-label">
          Engineers
          <span className="config-count">{engineers.selectedUsers.length}/{users.length}</span>
          {customisedCount > 0 && (
            <span className="custom-count-badge">{customisedCount} custom</span>
          )}
        </h2>
        <button className="toggle-all-btn" onClick={actions.toggleAllUsers} disabled={running}>
          {allUsersSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div className="user-list">
        {users.map((user) => (
          <EngineerRow
            key={user.id}
            user={user}
            selected={selectedUserIds.has(user.id)}
            expanded={expandedUserId === user.id}
            override={overrides.get(user.id)}
            globalCallsMin={globals.callsMin}
            globalCallsMax={globals.callsMax}
            globalValidationRate={globals.validation}
            globalAcceptanceRate={globals.acceptance}
            globalAgentIds={globals.agentIds}
            agents={agents}
            disabled={running}
            onToggleSelect={actions.toggleUser}
            onToggleExpand={actions.toggleExpand}
            onOverrideChange={actions.setOverride}
            onResetOverride={actions.resetOverride}
          />
        ))}
      </div>
    </div>
  );
}

export const EngineerList = memo(EngineerListBase);
