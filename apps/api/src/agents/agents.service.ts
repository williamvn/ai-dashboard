import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Agent } from '@repo/types';
import { StoreService } from '../store/store.service';

@Injectable()
export class AgentsService implements OnModuleInit {
  constructor(private readonly store: StoreService) {}

  onModuleInit(): void {
    const agents: Agent[] = [
      {
        id: 'agent-refactor',
        name: 'Refactor Code',
        generatesLines: true,
        prices: { easy: 0.02, medium: 0.06, hard: 0.15 },
        latency: { easy: 800, medium: 2200, hard: 5500 },
      },
      {
        id: 'agent-test-gen',
        name: 'Test Generation',
        generatesLines: true,
        prices: { easy: 0.015, medium: 0.045, hard: 0.12 },
        latency: { easy: 600, medium: 1800, hard: 4200 },
      },
      {
        id: 'agent-debug',
        name: 'Debugging',
        generatesLines: true,
        prices: { easy: 0.025, medium: 0.07, hard: 0.18 },
        latency: { easy: 1000, medium: 2800, hard: 6500 },
      },
      {
        id: 'agent-api-gen',
        name: 'API Generation',
        generatesLines: true,
        prices: { easy: 0.03, medium: 0.09, hard: 0.22 },
        latency: { easy: 900, medium: 2500, hard: 6000 },
      },
      {
        id: 'agent-code-review',
        name: 'Code Reviewer',
        generatesLines: false,
        prices: { easy: 0.01, medium: 0.03, hard: 0.08 },
        latency: { easy: 400, medium: 1200, hard: 3000 },
      },
    ];

    this.store.agents.push(...agents);
  }

  findAll(): Agent[] {
    return this.store.agents;
  }

  findById(id: string): Agent | undefined {
    return this.store.findAgentById(id);
  }
}
