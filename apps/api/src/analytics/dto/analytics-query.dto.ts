import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class AnalyticsQueryDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'from must be a date in YYYY-MM-DD format' })
  from?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'to must be a date in YYYY-MM-DD format' })
  to?: string;
}
