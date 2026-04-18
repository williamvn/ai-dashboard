import { useQuery } from '@tanstack/react-query';
import { fetchOrgUsers } from '@/features/organizations/services/organizations.service';

export function useOrgUsers(orgId: string) {
  return useQuery({
    queryKey: ['org-users', orgId],
    queryFn: () => fetchOrgUsers(orgId),
    enabled: !!orgId,
    // User lists are stable within a session
    staleTime: 2 * 60 * 1000,
  });
}
