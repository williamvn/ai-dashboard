export interface UsageMetrics {
  totalCalls: number;
  /** date string (YYYY-MM-DD) → run count */
  callsPerDay: Record<string, number>;
  /** date string (YYYY-MM-DD) → unique active user count */
  dauPerDay: Record<string, number>;
  /** Average daily active users as a percentage of total org users (0–100) */
  adoptionPercentage: number;
  /** agentId → total run count */
  callsPerAgent: Record<string, number>;
}

export interface TokenMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  /** Average total tokens per run */
  tokensPerRun: number;
  /** Average total tokens per accepted run */
  tokensPerAcceptedRun: number;
  /** agentId → total tokens */
  tokensByAgent: Record<string, number>;
  /** date string (YYYY-MM-DD) → total tokens */
  tokensPerDay: Record<string, number>;
}

export interface CostMetrics {
  totalCost: number;
  /** Average cost per run (USD) */
  costPerRun: number;
  /** Average cost per accepted run (USD) */
  costPerAcceptedRun: number;
  /** agentId → total cost (USD) */
  costByAgent: Record<string, number>;
  /** date string (YYYY-MM-DD) → total cost (USD) */
  costPerDay: Record<string, number>;
}

export interface ValidationMetrics {
  /** % of runs that received a ValidationEvent (0–1) */
  validationRate: number;
  /** % of validated runs where accepted = true (0–1) */
  acceptanceRate: number;
  totalValidated: number;
  totalAccepted: number;
  totalRejected: number;
  totalGeneratedLines: number;
  totalValidatedLines: number;
  /** agentId → acceptance rate (0–1) */
  acceptanceRateByAgent: Record<string, number>;
}

export interface DashboardMetrics {
  usage: UsageMetrics;
  tokens: TokenMetrics;
  cost: CostMetrics;
  validation: ValidationMetrics;
  computedAt: string;
}
