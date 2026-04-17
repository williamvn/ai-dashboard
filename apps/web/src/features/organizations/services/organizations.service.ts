import type { Organization } from '@repo/types'
import { api } from '@/services/api'

export async function fetchOrganizations(): Promise<Organization[]> {
  return api.get<Organization[]>('/organizations')
}
