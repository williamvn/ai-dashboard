/**
 * Aggregated metric shapes returned by the analytics layer.
 * All aggregations are computed from in-memory AgentRun and UserAction arrays.
 */

// ---------------------------------------------------------------------------
// Usage & Adoption
// ---------------------------------------------------------------------------

export interface UsageMetrics {
  /** Total number of agent runs in the window */
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

// ---------------------------------------------------------------------------
// Cost
// ---------------------------------------------------------------------------

export interface CostMetrics {
  totalCost: number;
  /** agentId → total cost (USD) */
  costPerAgent: Record<string, number>;
  /** Average cost per run (USD) */
  costPerCall: number;
  /** date string (YYYY-MM-DD) → total cost (USD) */
  costPerDay: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Output & Value
// ---------------------------------------------------------------------------

export interface OutputMetrics {
  totalAccepted: number;
  totalRejected: number;
  /** Fraction of runs that were accepted (0–1) */
  acceptanceRate: number;
  totalGeneratedLines: number;
  totalAcceptedLines: number;
  /** agentId → acceptance rate (0–1) */
  acceptanceRatePerAgent: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Combined dashboard response
// ---------------------------------------------------------------------------

export interface DashboardMetrics {
  usage: UsageMetrics;
  cost: CostMetrics;
  output: OutputMetrics;
  /** ISO timestamp of when these metrics were computed */
  computedAt: string;
}
