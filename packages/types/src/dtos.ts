import type { TaskLevel } from './entities';

export interface RunAgentResponse {
  runId: string;
  cost: number;
  latency: number;
  generatedLines?: number;
}

export interface AcceptOutputResponse {
  success: boolean;
}

export interface AnalyticsQuery {
  organizationId: string;
  from?: string;
  to?: string;
}

export interface RunAgentRequest {
  userId: string;
  agentId: string;
  taskLevel: TaskLevel;
}

export interface AcceptOutputRequest {
  runId: string;
  accepted: boolean;
  acceptedLines?: number;
}
