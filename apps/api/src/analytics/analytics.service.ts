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

    return {
      usage: computeUsage(stats, days, totalUsers),
      tokens: computeTokens(stats, days),
      cost: computeCost(stats, days),
      validation: computeValidation(stats),
      computedAt: new Date().toISOString(),
    };
  }
}

function computeUsage(stats: WindowStats, days: DayBucket[], totalUsers: number): UsageMetrics {
  const callsPerDay: Record<string, number> = {};
  const dauPerDay: Record<string, number> = {};
  let totalDau = 0;

  for (const bucket of days) {
    callsPerDay[bucket.date] = bucket.calls;
    dauPerDay[bucket.date] = bucket.activeUsers.size;
    totalDau += bucket.activeUsers.size;
  }

  const avgDau = days.length > 0 ? totalDau / days.length : 0;
  const callsPerAgent: Record<string, number> = {};
  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    callsPerAgent[agentId] = s.calls;
  }

  return {
    totalCalls: stats.totalCalls,
    callsPerDay,
    dauPerDay,
    adoptionPercentage: totalUsers > 0 ? Math.min((avgDau / totalUsers) * 100, 100) : 0,
    callsPerAgent,
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
    usage: { totalCalls: 0, callsPerDay: {}, dauPerDay: {}, adoptionPercentage: 0, callsPerAgent: {} },
    tokens: { totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0, tokensPerRun: 0, tokensPerAcceptedRun: 0, tokensByAgent: {}, tokensPerDay: {} },
    cost: { totalCost: 0, costPerRun: 0, costPerAcceptedRun: 0, costByAgent: {}, costPerDay: {} },
    validation: { validationRate: 0, acceptanceRate: 0, totalValidated: 0, totalAccepted: 0, totalRejected: 0, totalGeneratedLines: 0, totalValidatedLines: 0, acceptanceRateByAgent: {} },
    computedAt: new Date().toISOString(),
  };
}
