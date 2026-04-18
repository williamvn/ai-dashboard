import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AnalyticsQueryDto } from './analytics-query.dto';

export const RANK_BY_TOTAL = 'total';
export const DEFAULT_USER_RANKING_LIMIT = 20;
export const MAX_USER_RANKING_LIMIT = 100;

export class UserRankingQueryDto extends AnalyticsQueryDto {
  /**
   * `total` ranks by the user's total call count across all agents (default).
   * Any other value is treated as an agent id — users are ranked by their call
   * count to that specific agent.
   */
  @IsOptional()
  @IsString()
  rankBy?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_USER_RANKING_LIMIT)
  limit?: number;
}
