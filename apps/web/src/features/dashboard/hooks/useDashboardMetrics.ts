import { useQuery } from '@tanstack/react-query';
import type { AnalyticsQuery } from '@repo/types';
import { fetchCostAnalytics, fetchUsageMetrics } from '../services/analytics.service';

const STALE_MS = 30 * 1000;

export function useUsageMetrics(query: AnalyticsQuery) {
  return useQuery({
    queryKey: ['analytics', 'usage', query.organizationId, query.from, query.to] as const,
    queryFn: () => fetchUsageMetrics(query),
    staleTime: STALE_MS,
  });
}

export function useCostAnalytics(query: AnalyticsQuery) {
  return useQuery({
    queryKey: ['analytics', 'cost', query.organizationId, query.from, query.to] as const,
    queryFn: () => fetchCostAnalytics(query),
    staleTime: STALE_MS,
  });
}
