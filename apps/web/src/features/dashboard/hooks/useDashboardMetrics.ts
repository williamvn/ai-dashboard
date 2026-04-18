import { useQuery } from '@tanstack/react-query';
import type { AnalyticsQuery } from '@repo/types';
import { fetchDashboardMetrics } from '../services/analytics.service';

export function useDashboardMetrics(query: AnalyticsQuery) {
  return useQuery({
    queryKey: ['analytics', query.organizationId, query.from, query.to],
    queryFn: () => fetchDashboardMetrics(query),
    staleTime: 30 * 1000,
  });
}
