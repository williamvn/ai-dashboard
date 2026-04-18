import type { TaskLevel } from './entities';

export interface RunAgentRequest {
  userId: string;
  agentId: string;
  taskLevel: TaskLevel;
  timestamp?: number;
}

export interface RunAgentResponse {
  runId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  generatedLines?: number;
}

export interface ValidateOutputRequest {
  runId: string;
  accepted: boolean;
  validatedLines?: number;
}

export interface ValidateOutputResponse {
  success: boolean;
}

export interface AnalyticsQuery {
  organizationId: string;
  from?: string;
  to?: string;
}

export interface UserRankingQuery extends AnalyticsQuery {
  /** Either 'total' (default) or a specific agent id. */
  rankBy?: string;
  /** Default 20, max 100. */
  limit?: number;
}
