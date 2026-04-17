import { useQuery } from '@tanstack/react-query'
import { fetchOrganizations } from '../services/organizations.service'

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  })
}
