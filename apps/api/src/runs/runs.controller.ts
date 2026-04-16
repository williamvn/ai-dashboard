import { Body, Controller, Post } from '@nestjs/common';
import type { AcceptOutputResponse, RunAgentResponse } from '@repo/types';
import { AcceptOutputDto } from './dto/accept-output.dto';
import { RunAgentDto } from './dto/run-agent.dto';
import { RunsService } from './runs.service';

@Controller()
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Post('run-agent')
  runAgent(@Body() body: RunAgentDto): RunAgentResponse {
    return this.runs.runAgent(body);
  }

  @Post('accept-output')
  acceptOutput(@Body() body: AcceptOutputDto): AcceptOutputResponse {
    return this.runs.acceptOutput(body);
  }
}
