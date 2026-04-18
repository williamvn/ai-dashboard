import { Controller, Get, Query } from '@nestjs/common';
import type { CostAnalytics, ImpactAnalytics, UsageMetrics, UserUsageRanking } from '@repo/types';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { UserRankingQueryDto } from './dto/user-ranking-query.dto';
import { AnalyticsService } from './analytics.service';

/**
 * One route per analytics domain. Each request aggregates the window once and
 * returns every metric that domain covers — the cost route projects cost,
 * tokens, latency, user ranking, and per-agent call counts from a single pass.
 * The user ranking is split onto its own paginated route so large orgs aren't
 * penalised by shipping hundreds of rows on every dashboard load.
 */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('usage')
  getUsage(@Query() query: AnalyticsQueryDto): UsageMetrics {
    return this.analytics.getUsage(query);
  }

  @Get('usage/user-ranking')
  getUsageUserRanking(@Query() query: UserRankingQueryDto): UserUsageRanking[] {
    return this.analytics.getUserRanking(query);
  }

  @Get('cost')
  getCostAnalytics(@Query() query: AnalyticsQueryDto): CostAnalytics {
    return this.analytics.getCostAnalytics(query);
  }

  @Get('impact')
  getImpactAnalytics(@Query() query: AnalyticsQueryDto): ImpactAnalytics {
    return this.analytics.getImpactAnalytics(query);
  }
}
