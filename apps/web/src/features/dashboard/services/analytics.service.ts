import type { AnalyticsQuery, CostAnalytics, UsageMetrics } from '@repo/types';
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
