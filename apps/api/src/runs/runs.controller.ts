import { Body, Controller, Post } from '@nestjs/common';
import type { RunAgentResponse, ValidateOutputResponse } from '@repo/types';
import { RunAgentDto } from './dto/run-agent.dto';
import { ValidateOutputDto } from './dto/validate-output.dto';
import { RunsService } from './runs.service';

@Controller()
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Post('run-agent')
  runAgent(@Body() body: RunAgentDto): RunAgentResponse {
    return this.runs.runAgent(body);
  }

  @Post('validate-output')
  validateOutput(@Body() body: ValidateOutputDto): ValidateOutputResponse {
    return this.runs.validateOutput(body);
  }
}
