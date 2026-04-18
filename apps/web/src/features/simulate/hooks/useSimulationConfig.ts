import { useCallback, useMemo, useState } from 'react';
import type { Agent, User } from '@repo/types';
import type {
  EngineerOverride,
  EngineersActions,
  EngineersState,
  Globals,
  GlobalsActions,
} from '../types';

const DEFAULT_CALLS_MIN = 3;
const DEFAULT_CALLS_MAX = 8;
const DEFAULT_VALIDATION = 85;
const DEFAULT_ACCEPTANCE = 75;
const DEFAULT_DAYS = 30;

export interface UseSimulationConfig {
  globals: Globals;
  allAgentsSelected: boolean;
  globalsActions: GlobalsActions;
  engineers: EngineersState;
  engineersActions: EngineersActions;
}

export function useSimulationConfig({
  users,
  agents,
}: {
  users: User[];
  agents: Agent[];
}): UseSimulationConfig {
  // Global defaults. Overrides are nullable — `null` means "fall back to the full set
  // derived from server data", which cleanly distinguishes uninitialized from
  // user-cleared (empty array / empty Set).
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [callsMin, setCallsMin] = useState(DEFAULT_CALLS_MIN);
  const [callsMax, setCallsMax] = useState(DEFAULT_CALLS_MAX);
  const [validation, setValidation] = useState(DEFAULT_VALIDATION);
  const [acceptance, setAcceptance] = useState(DEFAULT_ACCEPTANCE);
  const [agentIdsOverride, setAgentIdsOverride] = useState<string[] | null>(null);

  // Selection + overrides
  const [selectedUserIdsOverride, setSelectedUserIdsOverride] = useState<Set<string> | null>(null);
  const [overrides, setOverrides] = useState<Map<string, EngineerOverride>>(new Map());
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Derived ──────────────────────────────────────────────────────────────────
  const agentIds = useMemo(
    () => agentIdsOverride ?? agents.map((a) => a.id),
    [agentIdsOverride, agents],
  );

  const selectedUserIds = useMemo(
    () => selectedUserIdsOverride ?? new Set(users.map((u) => u.id)),
    [selectedUserIdsOverride, users],
  );

  const allAgentsSelected = useMemo(
    () => agents.length > 0 && agents.every((a) => agentIds.includes(a.id)),
    [agents, agentIds],
  );

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedUserIds.has(u.id)),
    [users, selectedUserIds],
  );

  const allUsersSelected = useMemo(
    () => users.length > 0 && users.every((u) => selectedUserIds.has(u.id)),
    [users, selectedUserIds],
  );

  const estimatedCalls = useMemo(
    () =>
      selectedUsers.reduce((sum, u) => {
        const ov = overrides.get(u.id);
        const effectiveAgents = ov?.agentIds ?? agentIds;
        if (effectiveAgents.length === 0) return sum;
        const lo = ov?.callsPerDayMin ?? callsMin;
        const hi = ov?.callsPerDayMax ?? callsMax;
        return sum + ((lo + hi) / 2) * days;
      }, 0),
    [selectedUsers, overrides, callsMin, callsMax, agentIds, days],
  );

  // Stable actions ───────────────────────────────────────────────────────────
  const setCallsRange = useCallback((lo: number, hi: number) => {
    setCallsMin(lo);
    setCallsMax(hi);
  }, []);

  const toggleAgent = useCallback(
    (id: string) => {
      setAgentIdsOverride((prev) => {
        const current = prev ?? agents.map((a) => a.id);
        return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      });
    },
    [agents],
  );

  const toggleAllAgents = useCallback(() => {
    setAgentIdsOverride((prev) => {
      const current = prev ?? agents.map((a) => a.id);
      const allOn = agents.length > 0 && agents.every((a) => current.includes(a.id));
      return allOn ? [] : agents.map((a) => a.id);
    });
  }, [agents]);

  const reset = useCallback(() => {
    setCallsMin(DEFAULT_CALLS_MIN);
    setCallsMax(DEFAULT_CALLS_MAX);
    setValidation(DEFAULT_VALIDATION);
    setAcceptance(DEFAULT_ACCEPTANCE);
    setAgentIdsOverride(null);
    setOverrides(new Map());
  }, []);

  const toggleUser = useCallback(
    (userId: string) => {
      setSelectedUserIdsOverride((prev) => {
        const current = prev ?? new Set(users.map((u) => u.id));
        const next = new Set(current);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      });
    },
    [users],
  );

  const toggleAllUsers = useCallback(() => {
    setSelectedUserIdsOverride((prev) => {
      const current = prev ?? new Set(users.map((u) => u.id));
      const allOn = users.length > 0 && users.every((u) => current.has(u.id));
      return allOn ? new Set() : new Set(users.map((u) => u.id));
    });
  }, [users]);

  const toggleExpand = useCallback((userId: string) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  }, []);

  const setOverride = useCallback((userId: string, next: EngineerOverride) => {
    setOverrides((prev) => new Map(prev).set(userId, next));
  }, []);

  const resetOverride = useCallback((userId: string) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const globals = useMemo<Globals>(
    () => ({ days, callsMin, callsMax, validation, acceptance, agentIds }),
    [days, callsMin, callsMax, validation, acceptance, agentIds],
  );

  const globalsActions = useMemo<GlobalsActions>(
    () => ({
      setDays,
      setCallsRange,
      setValidation,
      setAcceptance,
      toggleAgent,
      toggleAllAgents,
      reset,
    }),
    [setCallsRange, toggleAgent, toggleAllAgents, reset],
  );

  const engineers = useMemo<EngineersState>(
    () => ({
      selectedUserIds,
      selectedUsers,
      overrides,
      expandedUserId,
      allUsersSelected,
      customisedCount: overrides.size,
      estimatedCalls,
    }),
    [selectedUserIds, selectedUsers, overrides, expandedUserId, allUsersSelected, estimatedCalls],
  );

  const engineersActions = useMemo<EngineersActions>(
    () => ({ toggleUser, toggleAllUsers, toggleExpand, setOverride, resetOverride }),
    [toggleUser, toggleAllUsers, toggleExpand, setOverride, resetOverride],
  );

  return { globals, allAgentsSelected, globalsActions, engineers, engineersActions };
}
