import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ValidateOutputDto {
  @IsString()
  @IsNotEmpty()
  runId: string;

  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  validatedLines?: number;
}
