import type { AnalyticsQuery, DashboardMetrics } from '@repo/types';
import { api } from '@/services/api';

export async function fetchDashboardMetrics(query: AnalyticsQuery): Promise<DashboardMetrics> {
  const params = new URLSearchParams();
  params.set('organizationId', query.organizationId);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  return api.get<DashboardMetrics>(`/analytics?${params.toString()}`);
}
