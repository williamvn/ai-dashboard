import { useQuery } from '@tanstack/react-query';
import { fetchAgents } from '@/services/agents.service';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    // Agents are reference data that never changes mid-session
    staleTime: 5 * 60 * 1000,
  });
}
