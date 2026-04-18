export interface UsageMetrics {
  totalCalls: number;
  /** Total users in the organization (engagement denominator). */
  totalUsers: number;
  /** Unique users with at least one run inside the window. */
  totalActiveUsers: number;
  /** Average calls per day over the window (totalCalls / windowDays) */
  avgCallsPerDay: number;
  /** Average daily active users over the window */
  avgDau: number;
  /** Calls per active user (totalCalls / totalActiveUsers) */
  callsPerActiveUser: number;
  /** date string (YYYY-MM-DD) → run count */
  callsPerDay: Record<string, number>;
  /** date string (YYYY-MM-DD) → unique active user count */
  dauPerDay: Record<string, number>;
  /** Average daily active users as a percentage of total org users (0–100) */
  adoptionPercentage: number;
  /** agentId → total run count */
  callsPerAgent: Record<string, number>;
  /** date string (YYYY-MM-DD) → agentId → run count */
  callsPerAgentPerDay: Record<string, Record<string, number>>;
  /** Days in the selected window (calendar-based when from+to set, else days-with-activity). */
  windowDays: number;
}

export interface TokenMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  /** Average total tokens per run */
  tokensPerRun: number;
  /** agentId → total tokens */
  tokensByAgent: Record<string, number>;
  /** agentId → total input tokens — powers the input/output stacked breakdown */
  inputTokensByAgent: Record<string, number>;
  /** agentId → total output tokens */
  outputTokensByAgent: Record<string, number>;
  /** date string (YYYY-MM-DD) → total tokens */
  tokensPerDay: Record<string, number>;
  /** agentId → date (YYYY-MM-DD) → total tokens */
  tokensByAgentPerDay: Record<string, Record<string, number>>;
  /** agentId → average tokens per run */
  avgTokensPerRunByAgent: Record<string, number>;
}

export interface CostMetrics {
  totalCost: number;
  /** All-time cost for the organization, ignoring the selected date window. */
  allTimeTotalCost: number;
  /** Average cost per run (USD) */
  costPerRun: number;
  /** Average cost per active user (USD) — ROI denominator. */
  costPerActiveUser: number;
  /** agentId → total cost (USD) */
  costByAgent: Record<string, number>;
  /** date string (YYYY-MM-DD) → total cost (USD) */
  costPerDay: Record<string, number>;
  /** agentId → date (YYYY-MM-DD) → cost (USD) */
  costByAgentPerDay: Record<string, Record<string, number>>;
  /** agentId → average cost per run (USD) */
  avgCostPerRunByAgent: Record<string, number>;
  /** agentId → average daily cost (USD) across the window */
  avgDailyCostByAgent: Record<string, number>;
  /** Total spend attributable to input tokens (USD) — frozen at write time. */
  inputCost: number;
  /** Total spend attributable to output tokens (USD) — frozen at write time. */
  outputCost: number;
  /** Unique active users in the window — informs costPerActiveUser and projections. */
  totalActiveUsers: number;
}

export interface AgentLatencyStats {
  avgMs: number;
  /** null when fewer than LATENCY_P95_MIN_SAMPLES observed — insufficient data. */
  p95Ms: number | null;
  calls: number;
}

export interface LatencyMetrics {
  avgMs: number;
  p95Ms: number | null;
  /** agentId → latency stats */
  byAgent: Record<string, AgentLatencyStats>;
}

export interface UserCostRanking {
  userId: string;
  userName: string;
  userProfilePicUrl: string;
  totalCalls: number;
  totalCost: number;
  totalTokens: number;
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

/**
 * Composite response for the cost analytics endpoint. One aggregation pass on
 * the backend projects out every slice related to spend — core cost metrics,
 * tokens, latency, top spenders, and a call-count breakdown per agent so the
 * cost-vs-usage correlation doesn't require a second request.
 */
export interface CostAnalytics {
  /** Days in the selected window — lifted here so the inner DTOs don't repeat it. */
  windowDays: number;
  cost: CostMetrics;
  tokens: TokenMetrics;
  latency: LatencyMetrics;
  userRanking: UserCostRanking[];
  /** agentId → total calls in window — correlates spend against raw volume. */
  callsPerAgent: Record<string, number>;
}
