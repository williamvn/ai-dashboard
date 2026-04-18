import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type {
  CostAnalytics,
  ImpactAnalytics,
  Organization,
  RunAgentResponse,
  UsageMetrics,
  User,
} from '@repo/types';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * End-to-end integration specs: real Nest pipeline (global ValidationPipe) +
 * real in-memory store + real seed data. Each test boots a fresh module so
 * state never leaks, and agents/users/orgs come from the production seed.
 */

const DAY_MS = 86_400_000;

async function bootstrapTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  // Mirror main.ts so DTO validation fires in tests.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

async function seededIds(app: INestApplication<App>) {
  const orgs = (await request(app.getHttpServer()).get('/organizations')).body as Organization[];
  const org = orgs[0]!;
  const users = (await request(app.getHttpServer()).get(`/organizations/${org.id}/users`))
    .body as User[];
  return { orgId: org.id, userId: users[0]!.id, secondaryOrgId: orgs[1]!.id, secondaryUserId: (await request(app.getHttpServer()).get(`/organizations/${orgs[1]!.id}/users`)).body[0].id as string };
}

describe('Run → Validate → Analytics flow', () => {
  let app: INestApplication<App>;
  beforeEach(async () => { app = await bootstrapTestApp(); });
  afterEach(async () => { await app.close(); });

  it('a run plus an acceptance flows through to every analytics surface', async () => {
    const { orgId, userId } = await seededIds(app);

    const runRes = await request(app.getHttpServer())
      .post('/run-agent')
      .send({ userId, agentId: 'agent-refactor', taskLevel: 'easy' })
      .expect(201);
    const run = runRes.body as RunAgentResponse;
    expect(run.runId).toBeDefined();
    expect(run.totalTokens).toBe(run.inputTokens + run.outputTokens);
    expect(run.cost).toBeGreaterThan(0);
    expect(run.generatedLines).toBeGreaterThan(0); // agent-refactor generates lines

    await request(app.getHttpServer())
      .post('/validate-output')
      .send({ runId: run.runId, accepted: true, validatedLines: 1 })
      .expect(201);

    const usage = (await request(app.getHttpServer())
      .get(`/analytics/usage?organizationId=${orgId}`)
      .expect(200)).body as UsageMetrics;
    expect(usage.totalCalls).toBe(1);
    expect(usage.totalActiveUsers).toBe(1);
    expect(usage.callsPerAgent['agent-refactor']).toBe(1);

    const cost = (await request(app.getHttpServer())
      .get(`/analytics/cost?organizationId=${orgId}`)
      .expect(200)).body as CostAnalytics;
    expect(cost.cost.totalCost).toBeCloseTo(run.cost, 10);
    expect(cost.tokens.totalTokens).toBe(run.totalTokens);

    const impact = (await request(app.getHttpServer())
      .get(`/analytics/impact?organizationId=${orgId}`)
      .expect(200)).body as ImpactAnalytics;
    expect(impact.impact.totalCalls).toBe(1);
    expect(impact.impact.totalValidated).toBe(1);
    expect(impact.impact.totalAccepted).toBe(1);
    expect(impact.impact.acceptanceRate).toBe(1);
    expect(impact.impact.totalValidatedLines).toBe(1);
  });

  it('rejects a second validation for the same run with 400', async () => {
    const { userId } = await seededIds(app);
    const run = (await request(app.getHttpServer())
      .post('/run-agent')
      .send({ userId, agentId: 'agent-refactor', taskLevel: 'easy' })
      .expect(201)).body as RunAgentResponse;

    await request(app.getHttpServer())
      .post('/validate-output')
      .send({ runId: run.runId, accepted: true })
      .expect(201);

    await request(app.getHttpServer())
      .post('/validate-output')
      .send({ runId: run.runId, accepted: false })
      .expect(400);
  });

  it('an unvalidated run shows up in usage/cost but not in impact acceptance', async () => {
    const { orgId, userId } = await seededIds(app);
    await request(app.getHttpServer())
      .post('/run-agent')
      .send({ userId, agentId: 'agent-refactor', taskLevel: 'easy' })
      .expect(201);

    const impact = (await request(app.getHttpServer())
      .get(`/analytics/impact?organizationId=${orgId}`)
      .expect(200)).body as ImpactAnalytics;
    expect(impact.impact.totalCalls).toBe(1);
    expect(impact.impact.totalValidated).toBe(0);
    expect(impact.impact.acceptanceRate).toBe(0); // no NaN
    expect(impact.impact.validationRate).toBe(0);
  });
});

describe('Organization reset', () => {
  let app: INestApplication<App>;
  beforeEach(async () => { app = await bootstrapTestApp(); });
  afterEach(async () => { await app.close(); });

  it('DELETE /organizations/:id/data wipes the target org while leaving others untouched', async () => {
    const { orgId, userId, secondaryOrgId, secondaryUserId } = await seededIds(app);

    // Seed data on both orgs.
    await request(app.getHttpServer())
      .post('/run-agent')
      .send({ userId, agentId: 'agent-refactor', taskLevel: 'easy' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/run-agent')
      .send({ userId, agentId: 'agent-refactor', taskLevel: 'medium' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/run-agent')
      .send({ userId: secondaryUserId, agentId: 'agent-refactor', taskLevel: 'easy' })
      .expect(201);

    const del = await request(app.getHttpServer())
      .delete(`/organizations/${orgId}/data`)
      .expect(200);
    expect(del.body).toEqual({ runsRemoved: 2 });

    const cleared = (await request(app.getHttpServer())
      .get(`/analytics/usage?organizationId=${orgId}`)
      .expect(200)).body as UsageMetrics;
    expect(cleared.totalCalls).toBe(0);
    expect(cleared.totalActiveUsers).toBe(0);

    const untouched = (await request(app.getHttpServer())
      .get(`/analytics/usage?organizationId=${secondaryOrgId}`)
      .expect(200)).body as UsageMetrics;
    expect(untouched.totalCalls).toBe(1);
  });

  it('returns 404 when clearing data for an unknown organization', async () => {
    await request(app.getHttpServer())
      .delete('/organizations/does-not-exist/data')
      .expect(404);
  });
});

describe('Analytics date filter', () => {
  let app: INestApplication<App>;
  beforeEach(async () => { app = await bootstrapTestApp(); });
  afterEach(async () => { await app.close(); });

  it('restricts totals and callsPerDay to the requested window, preserving windowDays', async () => {
    const { orgId, userId } = await seededIds(app);

    // Seed three runs at three distinct UTC days by passing explicit timestamps.
    const day1 = Date.UTC(2026, 0, 1); // 2026-01-01
    const day3 = Date.UTC(2026, 0, 3);
    const day5 = Date.UTC(2026, 0, 5);
    for (const timestamp of [day1, day3, day5]) {
      await request(app.getHttpServer())
        .post('/run-agent')
        .send({ userId, agentId: 'agent-refactor', taskLevel: 'easy', timestamp })
        .expect(201);
    }

    // Full window — everything, windowDays spans the calendar.
    const full = (await request(app.getHttpServer())
      .get(`/analytics/usage?organizationId=${orgId}&from=2026-01-01&to=2026-01-05`)
      .expect(200)).body as UsageMetrics;
    expect(full.totalCalls).toBe(3);
    expect(full.windowDays).toBe(5);
    expect(Object.keys(full.callsPerDay).sort()).toEqual([
      '2026-01-01',
      '2026-01-03',
      '2026-01-05',
    ]);

    // Narrowed window — only the middle day survives.
    const narrow = (await request(app.getHttpServer())
      .get(`/analytics/usage?organizationId=${orgId}&from=2026-01-02&to=2026-01-04`)
      .expect(200)).body as UsageMetrics;
    expect(narrow.totalCalls).toBe(1);
    expect(narrow.windowDays).toBe(3);
    expect(Object.keys(narrow.callsPerDay)).toEqual(['2026-01-03']);
  });
});

describe('DTO validation', () => {
  let app: INestApplication<App>;
  beforeEach(async () => { app = await bootstrapTestApp(); });
  afterEach(async () => { await app.close(); });

  it('rejects POST /run-agent with a missing userId', async () => {
    await request(app.getHttpServer())
      .post('/run-agent')
      .send({ agentId: 'agent-refactor', taskLevel: 'easy' })
      .expect(400);
  });

  it('rejects POST /run-agent with an invalid taskLevel', async () => {
    const { userId } = await seededIds(app);
    await request(app.getHttpServer())
      .post('/run-agent')
      .send({ userId, agentId: 'agent-refactor', taskLevel: 'extreme' })
      .expect(400);
  });

  it('rejects POST /validate-output when accepted is not a boolean', async () => {
    await request(app.getHttpServer())
      .post('/validate-output')
      .send({ runId: 'run-123', accepted: 'yes' })
      .expect(400);
  });

  it('rejects GET /analytics/usage with a malformed from date', async () => {
    const { orgId } = await seededIds(app);
    await request(app.getHttpServer())
      .get(`/analytics/usage?organizationId=${orgId}&from=2026/01/01`)
      .expect(400);
  });

  it('rejects GET /analytics/usage/user-ranking with a limit above the documented max', async () => {
    const { orgId } = await seededIds(app);
    await request(app.getHttpServer())
      .get(`/analytics/usage/user-ranking?organizationId=${orgId}&limit=500`)
      .expect(400);
  });

  it('returns 404 for analytics on an unknown organization', async () => {
    await request(app.getHttpServer())
      .get('/analytics/usage?organizationId=nope')
      .expect(404);
  });

  it('returns 404 for run-agent when the user does not exist', async () => {
    await request(app.getHttpServer())
      .post('/run-agent')
      .send({ userId: 'user-does-not-exist', agentId: 'agent-refactor', taskLevel: 'easy' })
      .expect(404);
  });
});
