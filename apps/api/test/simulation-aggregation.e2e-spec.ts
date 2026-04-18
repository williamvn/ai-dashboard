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
 * Scale-flavoured integration spec: 200 runs × 3 agents × 14 days + 200
 * validations, then every analytics surface is asserted against the ground
 * truth we tracked client-side.
 *
 * Assertion strategy (see "three classes" comment below):
 *   1. Structural invariants — always exact, never flaky.
 *   2. Counted exacts — we tracked what we submitted, so server totals must match.
 *   3. Statistical bounds — reserved for the token sampling we can't count, kept
 *      within the profile range (impossible to flake by construction).
 *
 * Tagged @scale in the describe name. If this suite ever grows past a few
 * seconds it should move behind its own npm script so the fast e2e lane stays
 * sub-second on every push — split the jest-e2e config (or add a testPathIgnore
 * on the fast one) before adding more scale tests here.
 *
 * Boot happens once; three tests read the same seeded state to keep the suite
 * fast. Total runtime ≈ 1–2 seconds on an in-process supertest.
 */

const RUNS = 200;
const WINDOW_DAYS = 14;
const FROM = '2026-01-01';
const TO = '2026-01-14';
const AGENTS = ['agent-refactor', 'agent-test-gen', 'agent-debug'] as const;
const ACCEPTANCE_TARGET = 0.75;

interface Submitted {
  byAgent: Map<string, number>;
  byDay: Map<string, number>;
  accepted: number;
  rejected: number;
}

interface Seeded {
  submitted: Submitted;
  usage: UsageMetrics;
  cost: CostAnalytics;
  impact: ImpactAnalytics;
}

function sumValues(record: Record<string, number>): number {
  return Object.values(record).reduce((sum, v) => sum + v, 0);
}

describe('simulation aggregation @scale @integration', () => {
  let app: INestApplication<App>;
  let seeded: Seeded;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const orgs = (await request(app.getHttpServer()).get('/organizations'))
      .body as Organization[];
    const orgId = orgs[0]!.id;
    const users = (await request(app.getHttpServer()).get(`/organizations/${orgId}/users`))
      .body as User[];
    const userId = users[0]!.id;

    const submitted: Submitted = {
      byAgent: new Map(),
      byDay: new Map(),
      accepted: 0,
      rejected: 0,
    };
    const runIds: string[] = [];

    for (let i = 0; i < RUNS; i++) {
      const agentId = AGENTS[i % AGENTS.length]!;
      const dayOffset = i % WINDOW_DAYS;
      const timestamp = Date.UTC(2026, 0, 1 + dayOffset);
      const dayKey = new Date(timestamp).toISOString().slice(0, 10);

      const run = (await request(app.getHttpServer())
        .post('/run-agent')
        .send({ userId, agentId, taskLevel: 'easy', timestamp })
        .expect(201)).body as RunAgentResponse;

      runIds.push(run.runId);
      submitted.byAgent.set(agentId, (submitted.byAgent.get(agentId) ?? 0) + 1);
      submitted.byDay.set(dayKey, (submitted.byDay.get(dayKey) ?? 0) + 1);
    }

    for (const runId of runIds) {
      const accept = Math.random() < ACCEPTANCE_TARGET;
      if (accept) submitted.accepted++;
      else submitted.rejected++;
      await request(app.getHttpServer())
        .post('/validate-output')
        .send({ runId, accepted: accept })
        .expect(201);
    }

    const base = `organizationId=${orgId}&from=${FROM}&to=${TO}`;
    const [usage, cost, impact] = await Promise.all([
      request(app.getHttpServer()).get(`/analytics/usage?${base}`).expect(200),
      request(app.getHttpServer()).get(`/analytics/cost?${base}`).expect(200),
      request(app.getHttpServer()).get(`/analytics/impact?${base}`).expect(200),
    ]);

    seeded = {
      submitted,
      usage: usage.body,
      cost: cost.body,
      impact: impact.body,
    };
  }, 30_000);

  afterAll(async () => {
    // Guard against beforeAll throwing before `app` was assigned — otherwise
    // teardown masks the real setup error with "cannot read .close of undefined".
    if (app) await app.close();
  });

  // Class 1 — Structural invariants. These hold regardless of randomness,
  // because aggregation is deterministic even when generation isn't.
  describe('structural invariants', () => {
    it('usage totals reconcile: totalCalls equals Σ callsPerDay equals Σ callsPerAgent', () => {
      const { usage } = seeded;
      expect(usage.totalCalls).toBe(RUNS);
      expect(usage.windowDays).toBe(WINDOW_DAYS);
      expect(sumValues(usage.callsPerDay)).toBe(RUNS);
      expect(sumValues(usage.callsPerAgent)).toBe(RUNS);
    });

    it('cost partitions reconcile: Σ costPerDay and Σ costByAgent both equal totalCost', () => {
      const { cost } = seeded;
      expect(sumValues(cost.cost.costPerDay)).toBeCloseTo(cost.cost.totalCost, 6);
      expect(sumValues(cost.cost.costByAgent)).toBeCloseTo(cost.cost.totalCost, 6);
      expect(cost.cost.inputCost + cost.cost.outputCost).toBeCloseTo(cost.cost.totalCost, 6);
    });

    it('tokens reconcile: input + output equals total, at window and per-agent levels', () => {
      const { cost } = seeded;
      expect(cost.tokens.totalInputTokens + cost.tokens.totalOutputTokens).toBe(
        cost.tokens.totalTokens,
      );
      for (const agentId of AGENTS) {
        expect(
          cost.tokens.inputTokensByAgent[agentId]! + cost.tokens.outputTokensByAgent[agentId]!,
        ).toBe(cost.tokens.tokensByAgent[agentId]);
      }
      expect(sumValues(cost.tokens.tokensByAgent)).toBe(cost.tokens.totalTokens);
    });

    it('impact counts reconcile: accepted + rejected equals validated, validated equals totalCalls', () => {
      const { impact } = seeded;
      expect(impact.impact.totalAccepted + impact.impact.totalRejected).toBe(
        impact.impact.totalValidated,
      );
      expect(impact.impact.totalValidated).toBe(RUNS);
      expect(impact.impact.totalCalls).toBe(RUNS);
    });

    it('the same totalCalls appears in every analytics endpoint', () => {
      expect(seeded.usage.totalCalls).toBe(RUNS);
      expect(seeded.impact.impact.totalCalls).toBe(RUNS);
      // Cost doesn't expose totalCalls directly, but callsPerAgent sums to it.
      expect(sumValues(seeded.cost.callsPerAgent)).toBe(RUNS);
    });
  });

  // Class 2 — Counted exacts. We tracked what we submitted, so the server's
  // aggregates must match byte-for-byte. This is where most of the value lives:
  // the test stays deterministic even though token sampling is random.
  describe('counted exacts', () => {
    it('per-agent call counts match what we submitted', () => {
      for (const [agentId, expected] of seeded.submitted.byAgent) {
        expect(seeded.usage.callsPerAgent[agentId]).toBe(expected);
        expect(seeded.cost.callsPerAgent[agentId]).toBe(expected);
      }
    });

    it('per-day call counts match what we submitted', () => {
      for (const [day, expected] of seeded.submitted.byDay) {
        expect(seeded.usage.callsPerDay[day]).toBe(expected);
      }
    });

    it('accepted and rejected totals match what we flagged client-side', () => {
      expect(seeded.impact.impact.totalAccepted).toBe(seeded.submitted.accepted);
      expect(seeded.impact.impact.totalRejected).toBe(seeded.submitted.rejected);
    });

    it('acceptance and validation rates fall out of the counted totals exactly', () => {
      const expectedAcceptance = seeded.submitted.accepted / RUNS;
      expect(seeded.impact.impact.validationRate).toBe(1); // every run validated
      expect(seeded.impact.impact.acceptanceRate).toBeCloseTo(expectedAcceptance, 10);
    });

    it('avgDau equals distinct active users (1) because only one engineer submitted', () => {
      expect(seeded.usage.totalActiveUsers).toBe(1);
      // One user active on every day that had at least one run.
      const activeDays = Object.values(seeded.usage.dauPerDay).filter((c) => c > 0).length;
      expect(activeDays).toBe(WINDOW_DAYS);
    });
  });

  // Class 3 — Statistical bounds. Reserved for quantities we can't count
  // deterministically. Bounds are drawn from the agent profile itself, so they
  // can only fail if the server samples outside the configured range.
  describe('statistical bounds', () => {
    it('average input tokens per agent fall inside the easy profile range', () => {
      const { cost } = seeded;
      // Easy-profile inputMin/inputMax per agent (from agents.service.ts).
      const easyInputRange: Record<(typeof AGENTS)[number], [number, number]> = {
        'agent-refactor': [500, 2000],
        'agent-test-gen': [300, 900],
        'agent-debug': [2000, 5000],
      };

      for (const agentId of AGENTS) {
        const calls = cost.callsPerAgent[agentId]!;
        const avgInput = cost.tokens.inputTokensByAgent[agentId]! / calls;
        const [min, max] = easyInputRange[agentId];
        expect(avgInput).toBeGreaterThanOrEqual(min);
        expect(avgInput).toBeLessThanOrEqual(max);
      }
    });

    it('average output tokens per agent fall inside the easy profile range', () => {
      const { cost } = seeded;
      const easyOutputRange: Record<(typeof AGENTS)[number], [number, number]> = {
        'agent-refactor': [500, 1500],
        'agent-test-gen': [600, 1400],
        'agent-debug': [200, 800],
      };

      for (const agentId of AGENTS) {
        const calls = cost.callsPerAgent[agentId]!;
        const avgOutput = cost.tokens.outputTokensByAgent[agentId]! / calls;
        const [min, max] = easyOutputRange[agentId];
        expect(avgOutput).toBeGreaterThanOrEqual(min);
        expect(avgOutput).toBeLessThanOrEqual(max);
      }
    });

    it('average cost per run is positive and well under the per-run ceiling for easy tasks', () => {
      const avgCostPerRun = seeded.cost.cost.totalCost / RUNS;
      expect(avgCostPerRun).toBeGreaterThan(0);
      // Sanity ceiling: the most expensive easy agent (agent-debug) caps at
      // ~0.05/run; 1.00 is a generous 20× margin that cannot flake.
      expect(avgCostPerRun).toBeLessThan(1);
    });
  });
});
