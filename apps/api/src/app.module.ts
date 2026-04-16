import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AgentsModule } from './agents/agents.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RunsModule } from './runs/runs.module';
import { SeedModule } from './seed/seed.module';
import { StoreModule } from './store/store.module';

@Module({
  controllers: [AppController],
  imports: [
    StoreModule,
    SeedModule,
    AgentsModule,
    RunsModule,
    AnalyticsModule,
    OrganizationsModule,
  ],
})
export class AppModule {}
