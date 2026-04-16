import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AcceptOutputDto {
  @IsString()
  @IsNotEmpty()
  runId: string;

  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  acceptedLines?: number;
}
