import type { Organization, User } from '@repo/types';

export const ORG_A: Organization = { id: 'org-a', name: 'Acme', profilePicUrl: '' };
export const ORG_B: Organization = { id: 'org-b', name: 'Beta', profilePicUrl: '' };

export const USER_A1: User = { id: 'user-a1', organizationId: ORG_A.id, name: 'Alice', profilePicUrl: 'pic-a1' };
export const USER_A2: User = { id: 'user-a2', organizationId: ORG_A.id, name: 'Bob', profilePicUrl: 'pic-a2' };
export const USER_A3: User = { id: 'user-a3', organizationId: ORG_A.id, name: 'Carol', profilePicUrl: 'pic-a3' };
export const USER_B1: User = { id: 'user-b1', organizationId: ORG_B.id, name: 'Dan', profilePicUrl: 'pic-b1' };

export const TEST_ORGS: Organization[] = [ORG_A, ORG_B];
export const TEST_USERS: User[] = [USER_A1, USER_A2, USER_A3, USER_B1];
