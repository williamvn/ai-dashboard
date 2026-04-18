import type {
  AnalyticsQuery,
  CostAnalytics,
  ImpactAnalytics,
  UsageMetrics,
  UserRankingQuery,
  UserUsageRanking,
} from '@repo/types';
import { api } from '@/services/api';

function toQueryString(query: AnalyticsQuery): string {
  const params = new URLSearchParams();
  params.set('organizationId', query.organizationId);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  return params.toString();
}

export function fetchUsageMetrics(query: AnalyticsQuery): Promise<UsageMetrics> {
  return api.get<UsageMetrics>(`/analytics/usage?${toQueryString(query)}`);
}

export function fetchCostAnalytics(query: AnalyticsQuery): Promise<CostAnalytics> {
  return api.get<CostAnalytics>(`/analytics/cost?${toQueryString(query)}`);
}

export function fetchImpactAnalytics(query: AnalyticsQuery): Promise<ImpactAnalytics> {
  return api.get<ImpactAnalytics>(`/analytics/impact?${toQueryString(query)}`);
}

export function fetchUserRanking(query: UserRankingQuery): Promise<UserUsageRanking[]> {
  const params = new URLSearchParams();
  params.set('organizationId', query.organizationId);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.rankBy) params.set('rankBy', query.rankBy);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  return api.get<UserUsageRanking[]>(`/analytics/usage/user-ranking?${params.toString()}`);
}
