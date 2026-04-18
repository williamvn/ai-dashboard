import type { Agent } from '@repo/types';
import { api } from '@/services/api';

export async function fetchAgents(): Promise<Agent[]> {
  return api.get<Agent[]>('/agents');
}
