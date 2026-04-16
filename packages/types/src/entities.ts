export type TaskLevel = 'easy' | 'medium' | 'hard';

export interface Organization {
  id: string;
  name: string;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
}

export interface Agent {
  id: string;
  name: string;
  generatesLines: boolean;
  prices: Record<TaskLevel, number>;
  latency: Record<TaskLevel, number>;
}

export interface AgentRun {
  id: string;
  organizationId: string;
  userId: string;
  agentId: string;
  taskLevel: TaskLevel;
  cost: number;
  latency: number;
  generatedLines?: number;
  timestamp: number;
}

export interface UserAction {
  runId: string;
  accepted: boolean;
  acceptedLines?: number;
}
