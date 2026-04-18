import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AnalyticsQuery, UserRankingQuery } from '@repo/types';
import {
  fetchCostAnalytics,
  fetchUsageMetrics,
  fetchUserRanking,
} from '../services/analytics.service';

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

export function useUserRanking(query: UserRankingQuery) {
  return useQuery({
    queryKey: [
      'analytics',
      'usage',
      'user-ranking',
      query.organizationId,
      query.from,
      query.to,
      query.rankBy ?? 'total',
      query.limit ?? null,
    ] as const,
    queryFn: () => fetchUserRanking(query),
    staleTime: STALE_MS,
    // Keep the prior rows rendered while a new `rankBy` resolves — otherwise the
    // card flashes through its empty/loading state on every agent switch.
    placeholderData: keepPreviousData,
  });
}
