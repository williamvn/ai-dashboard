import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import type { TaskLevel } from '@repo/types';

export class RunAgentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  agentId: string;

  @IsEnum(['easy', 'medium', 'hard'])
  taskLevel: TaskLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  timestamp?: number;
}
