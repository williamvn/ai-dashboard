import type { User } from '@repo/types';

export interface EngineerOverride {
  callsPerDayMin?: number;
  callsPerDayMax?: number;
  validationRate?: number;
  acceptanceRate?: number;
  agentIds?: string[];
}

export interface EngineerSimConfig {
  userId: string;
  callsPerDayMin: number;
  callsPerDayMax: number;
  validationRate: number;
  acceptanceRate: number;
  agentIds: string[];
}

/**
 * Global defaults applied to every engineer unless overridden.
 * Percentages are in whole-number form (0–100); simulate.service converts to 0–1.
 */
export interface Globals {
  days: number;
  callsMin: number;
  callsMax: number;
  validation: number;
  acceptance: number;
  agentIds: string[];
}

export interface GlobalsActions {
  setDays: (v: number) => void;
  setCallsRange: (lo: number, hi: number) => void;
  setValidation: (v: number) => void;
  setAcceptance: (v: number) => void;
  toggleAgent: (id: string) => void;
  toggleAllAgents: () => void;
  reset: () => void;
}

export interface EngineersState {
  selectedUserIds: Set<string>;
  selectedUsers: User[];
  overrides: Map<string, EngineerOverride>;
  expandedUserId: string | null;
  allUsersSelected: boolean;
  customisedCount: number;
  estimatedCalls: number;
}

export interface EngineersActions {
  toggleUser: (userId: string) => void;
  toggleAllUsers: () => void;
  toggleExpand: (userId: string) => void;
  setOverride: (userId: string, override: EngineerOverride) => void;
  resetOverride: (userId: string) => void;
}
