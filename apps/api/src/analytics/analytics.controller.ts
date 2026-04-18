import { Controller, Get, Query } from '@nestjs/common';
import type { CostAnalytics, UsageMetrics } from '@repo/types';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsService } from './analytics.service';

/**
 * One route per analytics domain. Each request aggregates the window once and
 * returns every metric that domain covers — the cost route projects cost,
 * tokens, latency, user ranking, and per-agent call counts from a single pass.
 */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('usage')
  getUsage(@Query() query: AnalyticsQueryDto): UsageMetrics {
    return this.analytics.getUsage(query);
  }

  @Get('cost')
  getCostAnalytics(@Query() query: AnalyticsQueryDto): CostAnalytics {
    return this.analytics.getCostAnalytics(query);
  }
}
