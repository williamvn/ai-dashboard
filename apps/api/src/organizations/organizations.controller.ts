import { Controller, Delete, Get, Param } from '@nestjs/common';
import type { Organization, User } from '@repo/types';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  findAll(): Organization[] {
    return this.organizations.findAll();
  }

  @Get(':id/users')
  findUsers(@Param('id') id: string): User[] {
    return this.organizations.findUsers(id);
  }

  @Delete(':id/data')
  clearData(@Param('id') id: string): { runsRemoved: number } {
    return this.organizations.clearData(id);
  }
}
