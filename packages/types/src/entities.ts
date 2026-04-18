export type TaskLevel = 'easy' | 'medium' | 'hard';

export interface Organization {
  id: string;
  name: string;
  profilePicUrl: string;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  profilePicUrl: string;
}

export interface TokenRange {
  inputMin: number;
  inputMax: number;
  outputMin: number;
  outputMax: number;
}

export interface Agent {
  id: string;
  name: string;
  generatesLines: boolean;
  inputTokenPrice: number;
  outputTokenPrice: number;
  tokenProfile: Record<TaskLevel, TokenRange>;
  latency: Record<TaskLevel, number>;
}

export interface AgentRun {
  id: string;
  organizationId: string;
  userId: string;
  agentId: string;
  taskLevel: TaskLevel;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  generatedLines?: number;
  timestamp: number;
}

export interface ValidationEvent {
  runId: string;
  accepted: boolean;
  validatedLines?: number;
}
