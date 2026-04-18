import type { Organization, User } from '@repo/types';
import { api } from '@/services/api';

export async function fetchOrganizations(): Promise<Organization[]> {
  return api.get<Organization[]>('/organizations');
}

export async function fetchOrgUsers(orgId: string): Promise<User[]> {
  return api.get<User[]>(`/organizations/${orgId}/users`);
}

export async function clearOrgData(orgId: string): Promise<{ runsRemoved: number }> {
  return api.delete<{ runsRemoved: number }>(`/organizations/${orgId}/data`);
}

