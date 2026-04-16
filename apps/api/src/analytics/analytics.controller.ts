import { Controller, Get, Query } from '@nestjs/common';
import type { DashboardMetrics } from '@repo/types';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get()
  getMetrics(@Query() query: AnalyticsQueryDto): DashboardMetrics {
    return this.analytics.getMetrics(query);
  }
}
