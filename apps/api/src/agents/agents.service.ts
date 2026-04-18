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
        inputTokenPrice: 0.000003,
        outputTokenPrice: 0.000015,
        tokenProfile: {
          easy:   { inputMin: 500,   inputMax: 2000,  outputMin: 500,  outputMax: 1500  },
          medium: { inputMin: 2000,  inputMax: 6000,  outputMin: 2000, outputMax: 5000  },
          hard:   { inputMin: 6000,  inputMax: 14000, outputMin: 5000, outputMax: 12000 },
        },
        latency: { easy: 800, medium: 2200, hard: 5500 },
      },
      {
        id: 'agent-test-gen',
        name: 'Test Generation',
        generatesLines: true,
        inputTokenPrice: 0.000003,
        outputTokenPrice: 0.000015,
        tokenProfile: {
          easy:   { inputMin: 300,  inputMax: 900,   outputMin: 600,  outputMax: 1400  },
          medium: { inputMin: 600,  inputMax: 1800,  outputMin: 2000, outputMax: 4000  },
          hard:   { inputMin: 1200, inputMax: 3600,  outputMin: 4000, outputMax: 10000 },
        },
        latency: { easy: 600, medium: 1800, hard: 4200 },
      },
      {
        // Input-heavy: reads large code context to find bugs
        id: 'agent-debug',
        name: 'Debugging',
        generatesLines: true,
        inputTokenPrice: 0.000005,
        outputTokenPrice: 0.000020,
        tokenProfile: {
          easy:   { inputMin: 2000,  inputMax: 5000,  outputMin: 200,  outputMax: 800  },
          medium: { inputMin: 5000,  inputMax: 12000, outputMin: 500,  outputMax: 2000 },
          hard:   { inputMin: 15000, inputMax: 30000, outputMin: 1500, outputMax: 5000 },
        },
        latency: { easy: 1000, medium: 2800, hard: 6500 },
      },
      {
        // Output-heavy: generates entire API layers
        id: 'agent-api-gen',
        name: 'API Generation',
        generatesLines: true,
        inputTokenPrice: 0.000003,
        outputTokenPrice: 0.000015,
        tokenProfile: {
          easy:   { inputMin: 500,  inputMax: 1500,  outputMin: 1200, outputMax: 2800  },
          medium: { inputMin: 1500, inputMax: 4500,  outputMin: 4000, outputMax: 8000  },
          hard:   { inputMin: 4000, inputMax: 10000, outputMin: 9000, outputMax: 20000 },
        },
        latency: { easy: 900, medium: 2500, hard: 6000 },
      },
      {
        // Premium model: high input (reads full code), low output (produces comments)
        id: 'agent-code-review',
        name: 'Code Reviewer',
        generatesLines: false,
        inputTokenPrice: 0.000008,
        outputTokenPrice: 0.000024,
        tokenProfile: {
          easy:   { inputMin: 400,  inputMax: 1000, outputMin: 100, outputMax: 300  },
          medium: { inputMin: 1200, inputMax: 3000, outputMin: 300, outputMax: 800  },
          hard:   { inputMin: 3000, inputMax: 8000, outputMin: 800, outputMax: 2000 },
        },
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
