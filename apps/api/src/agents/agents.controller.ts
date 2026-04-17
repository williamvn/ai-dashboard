import { Controller, Get } from '@nestjs/common';
import type { Agent } from '@repo/types';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  findAll(): Agent[] {
    return this.agents.findAll();
  }
}
