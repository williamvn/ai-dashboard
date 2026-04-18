import { Injectable, NotFoundException } from '@nestjs/common';
import type { CostMetrics, DashboardMetrics, TokenMetrics, UsageMetrics, ValidationMetrics } from '@repo/types';
import type { DayBucket, WindowStats } from '../store/store.service';
import { StoreService } from '../store/store.service';
import type { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly store: StoreService) {}

  getMetrics(query: AnalyticsQueryDto): DashboardMetrics {
    const { organizationId, from, to } = query;

    if (!this.store.orgExists(organizationId)) {
      throw new NotFoundException(`Organization "${organizationId}" not found`);
    }

    const stats = this.store.getOrgWindowStats(organizationId, from, to);
    if (!stats) return emptyDashboard();

    const days = this.store.getOrgDays(organizationId, from, to);
    const totalUsers = this.store.getUserCountForOrg(organizationId);
    const windowDays = countWindowDays(from, to) ?? days.length;

    return {
      usage: computeUsage(stats, days, totalUsers, windowDays),
      tokens: computeTokens(stats, days),
      cost: computeCost(stats, days),
      validation: computeValidation(stats),
      computedAt: new Date().toISOString(),
    };
  }
}

/**
 * Inclusive count of days between two YYYY-MM-DD dates. Returns undefined if the
 * range is open-ended; the caller falls back to the number of days with activity.
 */
function countWindowDays(from?: string, to?: string): number | undefined {
  if (!from || !to) return undefined;
  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(fromMs) || Number.isNaN(toMs) || toMs < fromMs) return undefined;
  return Math.floor((toMs - fromMs) / 86_400_000) + 1;
}

function computeUsage(
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

  // Adoption averages DAU over the full window span — a 30-day window with one
  // busy day shouldn't report the same adoption as 30 uniformly busy days.
  const avgDau = windowDays > 0 ? totalDau / windowDays : 0;
  const totalActiveUsers = stats.activeUsers.size;

  const callsPerAgent: Record<string, number> = {};
  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    callsPerAgent[agentId] = s.calls;
  }

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
    callsPerAgent,
    callsPerAgentPerDay,
  };
}

function computeTokens(stats: WindowStats, days: DayBucket[]): TokenMetrics {
  const tokensPerDay: Record<string, number> = {};
  for (const bucket of days) {
    tokensPerDay[bucket.date] = bucket.totalTokens;
  }

  const tokensByAgent: Record<string, number> = {};
  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    tokensByAgent[agentId] = s.totalTokens;
  }

  const tokensPerAcceptedRun = stats.totalAccepted > 0
    ? Object.values(stats.byAgent).reduce((sum, s) => sum + s.totalTokens * (s.calls > 0 ? s.accepted / s.calls : 0), 0) / stats.totalAccepted
    : 0;

  return {
    totalInputTokens: stats.totalInputTokens,
    totalOutputTokens: stats.totalOutputTokens,
    totalTokens: stats.totalTokens,
    tokensPerRun: stats.totalCalls > 0 ? stats.totalTokens / stats.totalCalls : 0,
    tokensPerAcceptedRun,
    tokensByAgent,
    tokensPerDay,
  };
}

function computeCost(stats: WindowStats, days: DayBucket[]): CostMetrics {
  const costPerDay: Record<string, number> = {};
  for (const bucket of days) {
    costPerDay[bucket.date] = bucket.cost;
  }

  const costByAgent: Record<string, number> = {};
  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    costByAgent[agentId] = s.cost;
  }

  const costPerAcceptedRun = stats.totalAccepted > 0
    ? Object.values(stats.byAgent).reduce((sum, s) => sum + s.cost * (s.calls > 0 ? s.accepted / s.calls : 0), 0) / stats.totalAccepted
    : 0;

  return {
    totalCost: stats.totalCost,
    costPerRun: stats.totalCalls > 0 ? stats.totalCost / stats.totalCalls : 0,
    costPerAcceptedRun,
    costByAgent,
    costPerDay,
  };
}

function computeValidation(stats: WindowStats): ValidationMetrics {
  const acceptanceRateByAgent: Record<string, number> = {};

  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    const validated = s.accepted + s.rejected;
    acceptanceRateByAgent[agentId] = validated > 0 ? s.accepted / validated : 0;
  }

  return {
    validationRate: stats.totalCalls > 0 ? stats.totalValidated / stats.totalCalls : 0,
    acceptanceRate: stats.totalValidated > 0 ? stats.totalAccepted / stats.totalValidated : 0,
    totalValidated: stats.totalValidated,
    totalAccepted: stats.totalAccepted,
    totalRejected: stats.totalRejected,
    totalGeneratedLines: stats.totalGeneratedLines,
    totalValidatedLines: stats.totalValidatedLines,
    acceptanceRateByAgent,
  };
}

function emptyDashboard(): DashboardMetrics {
  return {
    usage: { totalCalls: 0, totalUsers: 0, totalActiveUsers: 0, avgCallsPerDay: 0, avgDau: 0, callsPerActiveUser: 0, callsPerDay: {}, dauPerDay: {}, adoptionPercentage: 0, callsPerAgent: {}, callsPerAgentPerDay: {} },
    tokens: { totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0, tokensPerRun: 0, tokensPerAcceptedRun: 0, tokensByAgent: {}, tokensPerDay: {} },
    cost: { totalCost: 0, costPerRun: 0, costPerAcceptedRun: 0, costByAgent: {}, costPerDay: {} },
    validation: { validationRate: 0, acceptanceRate: 0, totalValidated: 0, totalAccepted: 0, totalRejected: 0, totalGeneratedLines: 0, totalValidatedLines: 0, acceptanceRateByAgent: {} },
    computedAt: new Date().toISOString(),
  };
}
