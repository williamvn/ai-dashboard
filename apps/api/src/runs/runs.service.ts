import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AgentRun, RunAgentResponse, ValidateOutputResponse, ValidationEvent, TaskLevel } from '@repo/types';
import { randomUUID } from 'crypto';
import { AgentsService } from '../agents/agents.service';
import { StoreService } from '../store/store.service';
import type { RunAgentDto } from './dto/run-agent.dto';
import type { ValidateOutputDto } from './dto/validate-output.dto';

const LINES_RANGE: Record<TaskLevel, [min: number, max: number]> = {
  easy:   [10,  60],
  medium: [60,  200],
  hard:   [200, 500],
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

    const profile = agent.tokenProfile[dto.taskLevel];
    const inputTokens = sampleInt(profile.inputMin, profile.inputMax);
    const outputTokens = sampleInt(profile.outputMin, profile.outputMax);
    const totalTokens = inputTokens + outputTokens;
    const inputCost = inputTokens * agent.inputTokenPrice;
    const outputCost = outputTokens * agent.outputTokenPrice;
    const cost = inputCost + outputCost;
    const latency = agent.latency[dto.taskLevel];
    const generatedLines = agent.generatesLines ? sampleInt(...LINES_RANGE[dto.taskLevel]) : undefined;
    const timestamp = dto.timestamp ?? Date.now();

    const run: AgentRun = {
      id: randomUUID(),
      organizationId: user.organizationId,
      userId: dto.userId,
      agentId: dto.agentId,
      taskLevel: dto.taskLevel,
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      inputCost,
      outputCost,
      latency,
      generatedLines,
      timestamp,
    };

    this.store.recordRun(run);

    return { runId: run.id, inputTokens, outputTokens, totalTokens, cost, latency, generatedLines };
  }

  validateOutput(dto: ValidateOutputDto): ValidateOutputResponse {
    const run = this.store.findRunById(dto.runId);
    if (!run) throw new NotFoundException(`Run "${dto.runId}" not found`);

    if (this.store.validations.has(dto.runId)) {
      throw new BadRequestException(`Run "${dto.runId}" has already been validated`);
    }

    if (dto.validatedLines !== undefined) {
      if (!dto.accepted) {
        throw new BadRequestException('validatedLines is only valid when accepted is true');
      }
      if (run.generatedLines === undefined) {
        throw new BadRequestException(
          `validatedLines is not valid for runs that do not generate lines`,
        );
      }
      if (dto.validatedLines > run.generatedLines) {
        throw new BadRequestException(
          `validatedLines (${dto.validatedLines}) cannot exceed generatedLines (${run.generatedLines})`,
        );
      }
    }

    const event: ValidationEvent = {
      runId: dto.runId,
      accepted: dto.accepted,
      validatedLines: dto.validatedLines,
    };

    this.store.recordValidation(run, event);

    return { success: true };
  }
}

function sampleInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
