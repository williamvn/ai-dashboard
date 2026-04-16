import { Injectable, NotFoundException } from '@nestjs/common';
import type { Organization, User } from '@repo/types';
import { StoreService } from '../store/store.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly store: StoreService) {}

  findAll(): Organization[] {
    return this.store.organizations;
  }

  findUsers(orgId: string): User[] {
    const org = this.store.organizations.find((o) => o.id === orgId);
    if (!org) throw new NotFoundException(`Organization "${orgId}" not found`);
    return this.store.users.filter((u) => u.organizationId === orgId);
  }

  clearData(orgId: string): { runsRemoved: number } {
    const org = this.store.organizations.find((o) => o.id === orgId);
    if (!org) throw new NotFoundException(`Organization "${orgId}" not found`);

    return this.store.clearOrgData(orgId);
  }
}
