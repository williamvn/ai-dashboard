import { Injectable, NotFoundException } from '@nestjs/common';
import type { CostMetrics, DashboardMetrics, OutputMetrics, UsageMetrics } from '@repo/types';
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
      cost: computeCost(stats, days),
      output: computeOutput(stats),
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

function computeCost(stats: WindowStats, days: DayBucket[]): CostMetrics {
  const costPerDay: Record<string, number> = {};
  for (const bucket of days) {
    costPerDay[bucket.date] = bucket.cost;
  }

  const costPerAgent: Record<string, number> = {};
  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    costPerAgent[agentId] = s.cost;
  }

  return {
    totalCost: stats.totalCost,
    costPerAgent,
    costPerCall: stats.totalCalls > 0 ? stats.totalCost / stats.totalCalls : 0,
    costPerDay,
  };
}

function computeOutput(stats: WindowStats): OutputMetrics {
  const reviewed = stats.totalAccepted + stats.totalRejected;
  const acceptanceRatePerAgent: Record<string, number> = {};

  for (const [agentId, s] of Object.entries(stats.byAgent)) {
    const total = s.accepted + s.rejected;
    acceptanceRatePerAgent[agentId] = total > 0 ? s.accepted / total : 0;
  }

  return {
    totalAccepted: stats.totalAccepted,
    totalRejected: stats.totalRejected,
    acceptanceRate: reviewed > 0 ? stats.totalAccepted / reviewed : 0,
    totalGeneratedLines: stats.totalGeneratedLines,
    totalAcceptedLines: stats.totalAcceptedLines,
    acceptanceRatePerAgent,
  };
}

function emptyDashboard(): DashboardMetrics {
  return {
    usage: { totalCalls: 0, callsPerDay: {}, dauPerDay: {}, adoptionPercentage: 0, callsPerAgent: {} },
    cost: { totalCost: 0, costPerAgent: {}, costPerCall: 0, costPerDay: {} },
    output: { totalAccepted: 0, totalRejected: 0, acceptanceRate: 0, totalGeneratedLines: 0, totalAcceptedLines: 0, acceptanceRatePerAgent: {} },
    computedAt: new Date().toISOString(),
  };
}
