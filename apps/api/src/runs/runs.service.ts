import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AgentRun, RunAgentResponse, AcceptOutputResponse, TaskLevel, UserAction } from '@repo/types';
import { randomUUID } from 'crypto';
import { AgentsService } from '../agents/agents.service';
import { StoreService } from '../store/store.service';
import type { RunAgentDto } from './dto/run-agent.dto';
import type { AcceptOutputDto } from './dto/accept-output.dto';

const LINES_RANGE: Record<TaskLevel, [min: number, max: number]> = {
  easy: [10, 60],
  medium: [60, 200],
  hard: [200, 500],
};

@Injectable()
export class RunsService {
  constructor(
    private readonly store: StoreService,
    private readonly agents: AgentsService,
  ) {}

  runAgent(dto: RunAgentDto): RunAgentResponse {
    const agent = this.agents.findById(dto.agentId);
    if (!agent) throw new NotFoundException(`Agent "${dto.agentId}" not found`);

    const user = this.store.findUserById(dto.userId);
    if (!user) throw new NotFoundException(`User "${dto.userId}" not found`);

    const cost = agent.prices[dto.taskLevel];
    const latency = agent.latency[dto.taskLevel];
    const generatedLines = agent.generatesLines ? sampleLines(dto.taskLevel) : undefined;
    const timestamp = dto.timestamp ?? Date.now();

    const run: AgentRun = {
      id: randomUUID(),
      organizationId: user.organizationId,
      userId: dto.userId,
      agentId: dto.agentId,
      taskLevel: dto.taskLevel,
      cost,
      latency,
      generatedLines,
      timestamp,
    };

    this.store.recordRun(run);

    return { runId: run.id, cost, latency, generatedLines };
  }

  acceptOutput(dto: AcceptOutputDto): AcceptOutputResponse {
    const run = this.store.findRunById(dto.runId);
    if (!run) throw new NotFoundException(`Run "${dto.runId}" not found`);

    if (this.store.actions.has(dto.runId)) {
      throw new BadRequestException(`Run "${dto.runId}" has already been reviewed`);
    }

    if (
      dto.acceptedLines !== undefined &&
      run.generatedLines !== undefined &&
      dto.acceptedLines > run.generatedLines
    ) {
      throw new BadRequestException(
        `acceptedLines (${dto.acceptedLines}) cannot exceed generatedLines (${run.generatedLines})`,
      );
    }

    const action: UserAction = {
      runId: dto.runId,
      accepted: dto.accepted,
      acceptedLines: dto.acceptedLines,
    };

    this.store.recordAction(run, action);

    return { success: true };
  }
}

function sampleLines(level: TaskLevel): number {
  const [min, max] = LINES_RANGE[level];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
