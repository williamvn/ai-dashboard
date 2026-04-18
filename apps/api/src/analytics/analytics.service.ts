import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AgentLatencyStats,
  CostAnalytics,
  CostMetrics,
  ImpactAnalytics,
  ImpactMetrics,
  LatencyMetrics,
  TokenMetrics,
  UsageMetrics,
  UserCostRanking,
  UserUsageRanking,
} from '@repo/types';
import type { DayBucket, WindowStats } from '../store/store.service';
import { LATENCY_BUCKET_COUNT, LATENCY_BUCKET_MS, StoreService } from '../store/store.service';
import type { AnalyticsQueryDto } from './dto/analytics-query.dto';
import {
  DEFAULT_USER_RANKING_LIMIT,
  RANK_BY_TOTAL,
  type UserRankingQueryDto,
} from './dto/user-ranking-query.dto';

/**
 * Minimum samples before p95 is considered stable. Below this, nearest-rank
 * collapses to near-max and misleads viewers — so we return null and let the
 * UI render "–". Shared constant duplicated in the web client (keep in sync).
 */
const LATENCY_P95_MIN_SAMPLES = 20;

const USER_RANKING_LIMIT = 20;

@Injectable()
export class AnalyticsService {
  constructor(private readonly store: StoreService) {}

  getUsage(query: AnalyticsQueryDto): UsageMetrics {
    const { stats, days, windowDays } = this.resolveWindow(query);
    const totalUsers = this.store.getUserCountForOrg(query.organizationId);
    return buildUsage(stats, days, totalUsers, windowDays);
  }

  getUserRanking(query: UserRankingQueryDto): UserUsageRanking[] {
    const { stats } = this.resolveWindow(query);
    const rankBy = query.rankBy && query.rankBy !== RANK_BY_TOTAL ? query.rankBy : RANK_BY_TOTAL;
    const limit = query.limit ?? DEFAULT_USER_RANKING_LIMIT;
    return buildUsageRanking(stats, rankBy, limit, (id) => this.store.findUserById(id));
  }

  getCostAnalytics(query: AnalyticsQueryDto): CostAnalytics {
    const { stats, days, windowDays } = this.resolveWindow(query);

    return {
      windowDays,
      cost: buildCost(stats, days, windowDays),
      tokens: buildTokens(stats, days),
      latency: buildLatency(stats),
      userRanking: buildUserRanking(stats, (id) => this.store.findUserById(id)),
      callsPerAgent: buildCallsPerAgent(stats),
    };
  }

  getImpactAnalytics(query: AnalyticsQueryDto): ImpactAnalytics {
    const { stats, days, windowDays } = this.resolveWindow(query);
    return {
      windowDays,
      impact: buildImpact(stats, days),
      callsPerAgent: buildCallsPerAgent(stats),
    };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private resolveWindow(
    query: AnalyticsQueryDto,
  ): { stats: WindowStats; days: DayBucket[]; windowDays: number } {
    if (!this.store.orgExists(query.organizationId)) {
      throw new NotFoundException(`Organization "${query.organizationId}" not found`);
    }

    const { organizationId, from, to } = query;
    const days = this.store.getOrgDays(organizationId, from, to);
    const stats = this.store.getOrgWindowStats(organizationId, from, to) ?? emptyWindowStats();
    const windowDays = countWindowDays(from, to) ?? days.length;
    return { stats, days, windowDays };
  }
}

// ---------------------------------------------------------------------------
// Stateless builders — deterministic given their inputs. Most operate purely
// over an already-resolved WindowStats; buildUserRanking additionally takes a
// user resolver since user metadata (name, profile pic) isn't carried on the
// aggregate itself.
// ---------------------------------------------------------------------------

function buildUsage(
  stats: WindowStats,
  days: DayBucket[],
  totalUsers: number,
  windowDays: number,
): UsageMetrics {
  const callsPerDay: Record<string, number> = {};
  const dauPerDay: Record<string, number> = {};
  const callsPerAgentPerDay: Record<string, Record<string, number>> = {};
  let totalDau = 0;

  for (const bucket of days) {
    callsPerDay[bucket.date] = bucket.calls;
    dauPerDay[bucket.date] = bucket.activeUsers.size;
    totalDau += bucket.activeUsers.size;

    const perAgent: Record<string, number> = {};
    for (const [agentId, s] of Object.entries(bucket.byAgent)) {
      if (s.calls > 0) perAgent[agentId] = s.calls;
    }
    callsPerAgentPerDay[bucket.date] = perAgent;
  }

  const avgDau = windowDays > 0 ? totalDau / windowDays : 0;
  const totalActiveUsers = stats.activeUsers.size;

  return {
    totalCalls: stats.totalCalls,
    totalUsers,
    totalActiveUsers,
    avgCallsPerDay: windowDays > 0 ? stats.totalCalls / windowDays : 0,
    avgDau,
    callsPerActiveUser: totalActiveUsers > 0 ? stats.totalCalls / totalActiveUsers : 0,
    callsPerDay,
    dauPerDay,
    adoptionPercentage: totalUsers > 0 ? Math.min((avgDau / totalUsers) * 100, 100) : 0,
    callsPerAgent: buildCallsPerAgent(stats),
    callsPerAgentPerDay,
    windowDays,
  };
}

/**
 * Ranks users by a chosen criterion and returns the top `limit`. The sort key
 * is either total calls across agents (`rankBy='total'`) or calls to a specific
 * agent (`rankBy=<agentId>`).
 */
function buildUsageRanking(
  stats: WindowStats,
  rankBy: string,
  limit: number,
  resolveUser: (userId: string) => { name: string; profilePicUrl: string } | undefined,
): UserUsageRanking[] {
  const isTotal = rankBy === RANK_BY_TOTAL;

  return Object.entries(stats.byUser)
    .map(([userId, s]) => {
      const user = resolveUser(userId);
      const calls = isTotal ? s.calls : (s.callsByAgent[rankBy] ?? 0);
      return {
        userId,
        userName: user?.name ?? userId,
        userProfilePicUrl: user?.profilePicUrl ?? '',
        calls,
        callsByAgent: s.callsByAgent,
      };
    })
    .filter((r) => r.calls > 0)
    .sort((a, b) => b.calls - a.calls)
    .slice(0, limit);
}

function buildCallsPerAgent(stats: WindowStats): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    out[agentId] = s.calls;
  }
  return out;
}

function buildTokens(stats: WindowStats, days: DayBucket[]): TokenMetrics {
  const tokensPerDay: Record<string, number> = {};
  const tokensByAgentPerDay: Record<string, Record<string, number>> = {};

  for (const bucket of days) {
    tokensPerDay[bucket.date] = bucket.totalTokens;
    for (const [agentId, s] of Object.entries(bucket.byAgent)) {
      if (s.totalTokens === 0) continue;
      if (!tokensByAgentPerDay[agentId]) tokensByAgentPerDay[agentId] = {};
      tokensByAgentPerDay[agentId][bucket.date] = s.totalTokens;
    }
  }

  const tokensByAgent: Record<string, number> = {};
  const inputTokensByAgent: Record<string, number> = {};
  const outputTokensByAgent: Record<string, number> = {};
  const avgTokensPerRunByAgent: Record<string, number> = {};
  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    tokensByAgent[agentId] = s.totalTokens;
    inputTokensByAgent[agentId] = s.inputTokens;
    outputTokensByAgent[agentId] = s.outputTokens;
    avgTokensPerRunByAgent[agentId] = s.calls > 0 ? s.totalTokens / s.calls : 0;
  }

  return {
    totalInputTokens: stats.totalInputTokens,
    totalOutputTokens: stats.totalOutputTokens,
    totalTokens: stats.totalTokens,
    tokensPerRun: stats.totalCalls > 0 ? stats.totalTokens / stats.totalCalls : 0,
    tokensByAgent,
    inputTokensByAgent,
    outputTokensByAgent,
    tokensPerDay,
    tokensByAgentPerDay,
    avgTokensPerRunByAgent,
  };
}

function buildCost(stats: WindowStats, days: DayBucket[], windowDays: number): CostMetrics {
  const costPerDay: Record<string, number> = {};
  const costByAgentPerDay: Record<string, Record<string, number>> = {};

  for (const bucket of days) {
    costPerDay[bucket.date] = bucket.cost;
    for (const [agentId, s] of Object.entries(bucket.byAgent)) {
      if (s.cost === 0) continue;
      if (!costByAgentPerDay[agentId]) costByAgentPerDay[agentId] = {};
      costByAgentPerDay[agentId][bucket.date] = s.cost;
    }
  }

  const costByAgent: Record<string, number> = {};
  const avgCostPerRunByAgent: Record<string, number> = {};
  const avgDailyCostByAgent: Record<string, number> = {};

  const divisor = windowDays > 0 ? windowDays : 1;
  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    costByAgent[agentId] = s.cost;
    avgCostPerRunByAgent[agentId] = s.calls > 0 ? s.cost / s.calls : 0;
    avgDailyCostByAgent[agentId] = s.cost / divisor;
  }

  const totalActiveUsers = stats.activeUsers.size;

  return {
    totalCost: stats.totalCost,
    allTimeTotalCost: stats.allTimeTotalCost,
    costPerRun: stats.totalCalls > 0 ? stats.totalCost / stats.totalCalls : 0,
    costPerActiveUser: totalActiveUsers > 0 ? stats.totalCost / totalActiveUsers : 0,
    costByAgent,
    costPerDay,
    costByAgentPerDay,
    avgCostPerRunByAgent,
    avgDailyCostByAgent,
    inputCost: stats.totalInputCost,
    outputCost: stats.totalOutputCost,
    totalActiveUsers,
  };
}

function buildLatency(stats: WindowStats): LatencyMetrics {
  const byAgent: Record<string, AgentLatencyStats> = {};
  let totalLatencySum = 0;
  let totalSamples = 0;
  const combinedHistogram = new Array(LATENCY_BUCKET_COUNT).fill(0);

  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    byAgent[agentId] = {
      avgMs: s.latencyCount > 0 ? s.latencySum / s.latencyCount : 0,
      p95Ms: histogramP95(s.latencyHistogram, s.latencyCount),
      calls: s.calls,
    };
    totalLatencySum += s.latencySum;
    totalSamples += s.latencyCount;
    for (let i = 0; i < LATENCY_BUCKET_COUNT; i++) {
      combinedHistogram[i] += s.latencyHistogram[i];
    }
  }

  return {
    avgMs: totalSamples > 0 ? totalLatencySum / totalSamples : 0,
    p95Ms: histogramP95(combinedHistogram, totalSamples),
    byAgent,
  };
}

function buildUserRanking(
  stats: WindowStats,
  resolveUser: (userId: string) => { name: string; profilePicUrl: string } | undefined,
): UserCostRanking[] {
  return Object.entries(stats.byUser)
    .map(([userId, s]) => {
      const user = resolveUser(userId);
      return {
        userId,
        userName: user?.name ?? userId,
        userProfilePicUrl: user?.profilePicUrl ?? '',
        totalCalls: s.calls,
        totalCost: s.cost,
        totalTokens: s.totalTokens,
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, USER_RANKING_LIMIT);
}

function countWindowDays(from?: string, to?: string): number | undefined {
  if (!from || !to) return undefined;
  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(fromMs) || Number.isNaN(toMs) || toMs < fromMs) return undefined;
  return Math.floor((toMs - fromMs) / 86_400_000) + 1;
}

/**
 * Nearest-rank p95 over a fixed-bucket histogram. Returns null when the sample
 * size is too small to be statistically stable — the UI renders "–" for that.
 * Reports the bucket upper edge (worst-case latency within that bucket).
 */
function histogramP95(histogram: number[], count: number): number | null {
  if (count < LATENCY_P95_MIN_SAMPLES) return null;
  const target = Math.ceil(0.95 * count);
  let cumulative = 0;
  for (let i = 0; i < histogram.length; i++) {
    cumulative += histogram[i];
    if (cumulative >= target) return (i + 1) * LATENCY_BUCKET_MS;
  }
  return histogram.length * LATENCY_BUCKET_MS;
}

function buildImpact(stats: WindowStats, days: DayBucket[]): ImpactMetrics {
  const acceptedByAgent: Record<string, number> = {};
  const rejectedByAgent: Record<string, number> = {};
  const acceptanceRateByAgent: Record<string, number> = {};
  const acceptedGeneratedLinesByAgent: Record<string, number> = {};
  const validatedLinesByAgent: Record<string, number> = {};
  const costPerAcceptedRunByAgent: Record<string, number> = {};
  const tokensPerAcceptedRunByAgent: Record<string, number> = {};

  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    const validated = s.accepted + s.rejected;
    acceptedByAgent[agentId] = s.accepted;
    rejectedByAgent[agentId] = s.rejected;
    acceptanceRateByAgent[agentId] = validated > 0 ? s.accepted / validated : 0;
    acceptedGeneratedLinesByAgent[agentId] = s.acceptedGeneratedLines;
    validatedLinesByAgent[agentId] = s.validatedLines;
    costPerAcceptedRunByAgent[agentId] = s.accepted > 0 ? s.acceptedCost / s.accepted : 0;
    tokensPerAcceptedRunByAgent[agentId] = s.accepted > 0 ? s.acceptedTokens / s.accepted : 0;
  }

  const acceptedPerDay: Record<string, number> = {};
  const rejectedPerDay: Record<string, number> = {};
  const acceptanceRatePerDay: Record<string, number> = {};
  const acceptedLinesPerDay: Record<string, number> = {};
  const acceptedLinesByAgentPerDay: Record<string, Record<string, number>> = {};

  for (const bucket of days) {
    let dayAccepted = 0;
    let dayRejected = 0;
    let dayAcceptedLines = 0;

    for (const [agentId, s] of Object.entries(bucket.byAgent)) {
      dayAccepted += s.accepted;
      dayRejected += s.rejected;
      dayAcceptedLines += s.validatedLines;
      if (s.validatedLines > 0) {
        if (!acceptedLinesByAgentPerDay[agentId]) acceptedLinesByAgentPerDay[agentId] = {};
        acceptedLinesByAgentPerDay[agentId][bucket.date] = s.validatedLines;
      }
    }

    const dayValidated = dayAccepted + dayRejected;
    acceptedPerDay[bucket.date] = dayAccepted;
    rejectedPerDay[bucket.date] = dayRejected;
    acceptanceRatePerDay[bucket.date] = dayValidated > 0 ? dayAccepted / dayValidated : 0;
    acceptedLinesPerDay[bucket.date] = dayAcceptedLines;
  }

  return {
    totalCalls: stats.totalCalls,
    totalValidated: stats.totalValidated,
    totalAccepted: stats.totalAccepted,
    totalRejected: stats.totalRejected,
    validationRate: stats.totalCalls > 0 ? stats.totalValidated / stats.totalCalls : 0,
    acceptanceRate: stats.totalValidated > 0 ? stats.totalAccepted / stats.totalValidated : 0,

    totalValidatedLines: stats.totalValidatedLines,
    acceptedGeneratedLines: stats.totalAcceptedGeneratedLines,
    avgLinesPerAcceptedRun: stats.totalAccepted > 0 ? stats.totalValidatedLines / stats.totalAccepted : 0,
    acceptedLineRatio:
      stats.totalAcceptedGeneratedLines > 0
        ? stats.totalValidatedLines / stats.totalAcceptedGeneratedLines
        : 0,

    totalAcceptedCost: stats.totalAcceptedCost,
    totalRejectedCost: stats.totalRejectedCost,
    costPerAcceptedRun: stats.totalAccepted > 0 ? stats.totalAcceptedCost / stats.totalAccepted : 0,
    costPerRejectedRun: stats.totalRejected > 0 ? stats.totalRejectedCost / stats.totalRejected : 0,
    tokensPerAcceptedRun: stats.totalAccepted > 0 ? stats.totalAcceptedTokens / stats.totalAccepted : 0,

    acceptedByAgent,
    rejectedByAgent,
    acceptanceRateByAgent,
    acceptedGeneratedLinesByAgent,
    validatedLinesByAgent,
    costPerAcceptedRunByAgent,
    tokensPerAcceptedRunByAgent,

    acceptedPerDay,
    rejectedPerDay,
    acceptanceRatePerDay,
    acceptedLinesPerDay,
    acceptedLinesByAgentPerDay,
  };
}

function emptyWindowStats(): WindowStats {
  return {
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    totalInputCost: 0,
    totalOutputCost: 0,
    totalValidated: 0,
    totalAccepted: 0,
    totalRejected: 0,
    totalValidatedLines: 0,
    totalAcceptedCost: 0,
    totalRejectedCost: 0,
    totalAcceptedTokens: 0,
    totalAcceptedGeneratedLines: 0,
    activeUsers: new Set<string>(),
    byAgent: {},
    byUser: {},
    windowDays: 0,
    allTimeTotalCost: 0,
  };
}
