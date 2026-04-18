// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import type { Agent, User } from '@repo/types';
import { describe, expect, it } from 'vitest';
import { useSimulationConfig } from './useSimulationConfig';

const AGENTS: Agent[] = [
  makeAgent('agent-refactor'),
  makeAgent('agent-test-gen'),
  makeAgent('agent-debug'),
];

const USERS: User[] = [
  { id: 'user-1', organizationId: 'org-1', name: 'Alice', profilePicUrl: '' },
  { id: 'user-2', organizationId: 'org-1', name: 'Bob', profilePicUrl: '' },
  { id: 'user-3', organizationId: 'org-1', name: 'Carol', profilePicUrl: '' },
];

function render(props = { users: USERS, agents: AGENTS }) {
  return renderHook(({ users, agents }) => useSimulationConfig({ users, agents }), {
    initialProps: props,
  });
}

describe('useSimulationConfig — defaults', () => {
  it('ships every engineer and every agent selected out of the box', () => {
    const { result } = render();
    expect(result.current.engineers.selectedUsers).toHaveLength(USERS.length);
    expect(result.current.engineers.allUsersSelected).toBe(true);
    expect(result.current.allAgentsSelected).toBe(true);
    expect(result.current.globals.agentIds).toEqual(AGENTS.map((a) => a.id));
  });

  it('starts with no per-engineer overrides', () => {
    const { result } = render();
    expect(result.current.engineers.overrides.size).toBe(0);
    expect(result.current.engineers.customisedCount).toBe(0);
  });

  it('uses the documented default globals', () => {
    const { result } = render();
    const { globals } = result.current;
    expect(globals.days).toBe(30);
    expect(globals.callsMin).toBe(3);
    expect(globals.callsMax).toBe(8);
    expect(globals.validation).toBe(85);
    expect(globals.acceptance).toBe(75);
  });
});

describe('useSimulationConfig — estimatedCalls', () => {
  it('is midpoint × days × engineer count when every engineer inherits globals', () => {
    const { result } = render();
    // (3 + 8) / 2 × 30 days × 3 engineers = 495
    expect(result.current.estimatedCalls).toBe(495);
  });

  it('excludes engineers whose override restricts them to zero agents', () => {
    const { result } = render();
    act(() => {
      result.current.engineersActions.setOverride('user-1', { agentIds: [] });
    });
    // user-1 contributes 0; user-2 + user-3 at midpoint 5.5 × 30 = 165 × 2 = 330
    expect(result.current.estimatedCalls).toBe(330);
  });

  it('uses per-engineer call ranges when overridden', () => {
    const { result } = render();
    act(() => {
      result.current.engineersActions.setOverride('user-1', {
        callsPerDayMin: 10,
        callsPerDayMax: 20,
      });
    });
    // user-1: 15 × 30 = 450; user-2 + user-3: 5.5 × 30 = 165 each → 330
    expect(result.current.estimatedCalls).toBe(780);
  });

  it('drops to zero when no engineers are selected', () => {
    const { result } = render();
    act(() => {
      result.current.engineersActions.toggleAllUsers();
    });
    expect(result.current.engineers.selectedUsers).toHaveLength(0);
    expect(result.current.estimatedCalls).toBe(0);
  });
});

describe('useSimulationConfig — agent toggles', () => {
  it('toggleAgent removes a selected agent and re-adds it on a second toggle', () => {
    const { result } = render();
    act(() => result.current.globalsActions.toggleAgent('agent-refactor'));

    expect(result.current.globals.agentIds).not.toContain('agent-refactor');
    expect(result.current.allAgentsSelected).toBe(false);

    act(() => result.current.globalsActions.toggleAgent('agent-refactor'));
    expect(result.current.globals.agentIds).toContain('agent-refactor');
    expect(result.current.allAgentsSelected).toBe(true);
  });

  it('toggleAllAgents clears every agent when all were selected, and reselects all when empty', () => {
    const { result } = render();
    act(() => result.current.globalsActions.toggleAllAgents());
    expect(result.current.globals.agentIds).toEqual([]);
    expect(result.current.allAgentsSelected).toBe(false);

    act(() => result.current.globalsActions.toggleAllAgents());
    expect(result.current.globals.agentIds).toEqual(AGENTS.map((a) => a.id));
    expect(result.current.allAgentsSelected).toBe(true);
  });
});

describe('useSimulationConfig — user selection', () => {
  it('toggleUser removes and re-adds an engineer', () => {
    const { result } = render();
    act(() => result.current.engineersActions.toggleUser('user-1'));
    expect(result.current.engineers.selectedUsers.map((u) => u.id)).toEqual([
      'user-2',
      'user-3',
    ]);
    expect(result.current.engineers.allUsersSelected).toBe(false);

    act(() => result.current.engineersActions.toggleUser('user-1'));
    expect(result.current.engineers.selectedUsers.map((u) => u.id)).toEqual([
      'user-1',
      'user-2',
      'user-3',
    ]);
    expect(result.current.engineers.allUsersSelected).toBe(true);
  });

  it('toggleAllUsers deselects everyone when all were selected, and reselects everyone when none', () => {
    const { result } = render();
    act(() => result.current.engineersActions.toggleAllUsers());
    expect(result.current.engineers.selectedUsers).toHaveLength(0);

    act(() => result.current.engineersActions.toggleAllUsers());
    expect(result.current.engineers.selectedUsers).toHaveLength(USERS.length);
  });
});

describe('useSimulationConfig — overrides', () => {
  it('setOverride adds an entry and bumps customisedCount', () => {
    const { result } = render();
    act(() =>
      result.current.engineersActions.setOverride('user-1', { validationRate: 50 }),
    );
    expect(result.current.engineers.customisedCount).toBe(1);
    expect(result.current.engineers.overrides.get('user-1')).toEqual({ validationRate: 50 });
  });

  it('resetOverride drops the entry', () => {
    const { result } = render();
    act(() =>
      result.current.engineersActions.setOverride('user-1', { validationRate: 50 }),
    );
    act(() => result.current.engineersActions.resetOverride('user-1'));
    expect(result.current.engineers.overrides.has('user-1')).toBe(false);
    expect(result.current.engineers.customisedCount).toBe(0);
  });

  it('setOverride replaces the prior override for the same engineer', () => {
    const { result } = render();
    act(() =>
      result.current.engineersActions.setOverride('user-1', { validationRate: 50 }),
    );
    act(() =>
      result.current.engineersActions.setOverride('user-1', { acceptanceRate: 90 }),
    );
    expect(result.current.engineers.overrides.get('user-1')).toEqual({ acceptanceRate: 90 });
  });
});

describe('useSimulationConfig — expand', () => {
  it('expands a single engineer at a time and collapses on second toggle', () => {
    const { result } = render();
    act(() => result.current.engineersActions.toggleExpand('user-1'));
    expect(result.current.engineers.expandedUserId).toBe('user-1');

    act(() => result.current.engineersActions.toggleExpand('user-2'));
    expect(result.current.engineers.expandedUserId).toBe('user-2');

    act(() => result.current.engineersActions.toggleExpand('user-2'));
    expect(result.current.engineers.expandedUserId).toBeNull();
  });
});

describe('useSimulationConfig — reset', () => {
  it('restores global defaults and clears overrides, but does not touch user selection', () => {
    const { result } = render();

    act(() => {
      result.current.globalsActions.setCallsRange(20, 40);
      result.current.globalsActions.setValidation(10);
      result.current.globalsActions.toggleAgent('agent-refactor');
      result.current.engineersActions.setOverride('user-1', { validationRate: 50 });
      result.current.engineersActions.toggleUser('user-1');
    });

    act(() => result.current.globalsActions.reset());

    const { globals, engineers } = result.current;
    expect(globals.callsMin).toBe(3);
    expect(globals.callsMax).toBe(8);
    expect(globals.validation).toBe(85);
    expect(globals.agentIds).toEqual(AGENTS.map((a) => a.id));
    expect(engineers.overrides.size).toBe(0);
    // reset() deliberately does not restore user selection.
    expect(engineers.selectedUsers.map((u) => u.id)).toEqual(['user-2', 'user-3']);
  });
});

function makeAgent(id: string): Agent {
  const range = { inputMin: 100, inputMax: 200, outputMin: 100, outputMax: 200 };
  return {
    id,
    name: id,
    generatesLines: true,
    inputTokenPrice: 0.001,
    outputTokenPrice: 0.001,
    tokenProfile: { easy: range, medium: range, hard: range },
    latency: { easy: 100, medium: 200, hard: 300 },
  };
}
