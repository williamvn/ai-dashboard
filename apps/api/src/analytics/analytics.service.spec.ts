import { NotFoundException } from '@nestjs/common';
import { AGENT_GEN, AGENT_REVIEW } from '../../test/fixtures/agents';
import { makeRun, makeValidation, resetRunSeq } from '../../test/fixtures/builders';
import { ORG_A, USER_A1, USER_A2, USER_A3 } from '../../test/fixtures/orgs';
import { makeStore } from '../../test/fixtures/store';
import { StoreService } from '../store/store.service';
import { AnalyticsService } from './analytics.service';

function expectAllFinite(obj: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number') {
      expect(Number.isFinite(v) || v === null).toBe(true);
      if (!Number.isFinite(v)) throw new Error(`${k} is not finite: ${v}`);
    }
  }
}

describe('AnalyticsService', () => {
  let store: StoreService;
  let service: AnalyticsService;

  beforeEach(() => {
    resetRunSeq();
    store = makeStore();
    service = new AnalyticsService(store);
  });

  describe('window resolution', () => {
    it('throws NotFoundException when the org does not exist', () => {
      expect(() => service.getUsage({ organizationId: 'missing' })).toThrow(NotFoundException);
    });

    it('returns empty metrics for a known org with no runs', () => {
      const usage = service.getUsage({ organizationId: ORG_A.id });
      expect(usage.totalCalls).toBe(0);
      expect(usage.totalUsers).toBe(3);
      expect(usage.totalActiveUsers).toBe(0);
      expect(usage.adoptionPercentage).toBe(0);
      expect(usage.callsPerDay).toEqual({});
      expect(usage.windowDays).toBe(0);
    });
  });

  describe('usage metrics', () => {
    it('computes totals, per-day buckets, and per-agent splits', () => {
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A1.id, agentId: AGENT_GEN.id }));
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A2.id, agentId: AGENT_GEN.id }));
      store.recordRun(makeRun({ date: '2026-01-02', userId: USER_A1.id, agentId: AGENT_REVIEW.id }));

      const usage = service.getUsage({
        organizationId: ORG_A.id,
        from: '2026-01-01',
        to: '2026-01-02',
      });

      expect(usage.totalCalls).toBe(3);
      expect(usage.callsPerDay).toEqual({ '2026-01-01': 2, '2026-01-02': 1 });
      expect(usage.callsPerAgent).toEqual({ [AGENT_GEN.id]: 2, [AGENT_REVIEW.id]: 1 });
      expect(usage.callsPerAgentPerDay).toEqual({
        '2026-01-01': { [AGENT_GEN.id]: 2 },
        '2026-01-02': { [AGENT_REVIEW.id]: 1 },
      });
    });

    it('counts distinct in-window active users only', () => {
      store.recordRun(makeRun({ date: '2025-12-01', userId: USER_A3.id }));
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A1.id }));
      store.recordRun(makeRun({ date: '2026-01-02', userId: USER_A1.id }));
      store.recordRun(makeRun({ date: '2026-01-02', userId: USER_A2.id }));

      const usage = service.getUsage({
        organizationId: ORG_A.id,
        from: '2026-01-01',
        to: '2026-01-02',
      });

      expect(usage.totalActiveUsers).toBe(2);
      expect(usage.dauPerDay).toEqual({ '2026-01-01': 1, '2026-01-02': 2 });
    });

    it('uses calendar days when a from/to window is set, and days-with-activity otherwise', () => {
      store.recordRun(makeRun({ date: '2026-01-01' }));
      store.recordRun(makeRun({ date: '2026-01-03' }));

      const windowed = service.getUsage({
        organizationId: ORG_A.id,
        from: '2026-01-01',
        to: '2026-01-05',
      });
      expect(windowed.windowDays).toBe(5);

      const activityOnly = service.getUsage({ organizationId: ORG_A.id });
      expect(activityOnly.windowDays).toBe(2);
    });

    it('computes adoption as average DAU over total users, capped at 100%', () => {
      // 3 seeded users; 1 DAU on each of 2 days ⇒ avgDau = 2/5 = 0.4 across a 5-day window.
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A1.id }));
      store.recordRun(makeRun({ date: '2026-01-02', userId: USER_A2.id }));

      const usage = service.getUsage({
        organizationId: ORG_A.id,
        from: '2026-01-01',
        to: '2026-01-05',
      });

      expect(usage.avgDau).toBeCloseTo(2 / 5, 10);
      expect(usage.adoptionPercentage).toBeCloseTo((2 / 5 / 3) * 100, 10);
      expect(usage.adoptionPercentage).toBeLessThanOrEqual(100);
    });

    it('clamps adoption to 100% when every user is active every day', () => {
      // Should not actually happen in prod, but the clamp guards against seed drift.
      // Force it by simulating unrealistic activity within the window.
      // 3 users, all active every day → avgDau = 3 → (3 / 3) × 100 = 100.
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A1.id }));
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A2.id }));
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A3.id }));

      const usage = service.getUsage({
        organizationId: ORG_A.id,
        from: '2026-01-01',
        to: '2026-01-01',
      });
      expect(usage.adoptionPercentage).toBe(100);
    });
  });

  describe('cost metrics', () => {
    it('sums per-run cost and preserves the input vs output split', () => {
      store.recordRun(makeRun({ date: '2026-01-01', inputTokens: 100, outputTokens: 50 })); // cost 2
      store.recordRun(makeRun({ date: '2026-01-02', inputTokens: 200, outputTokens: 100 })); // cost 4

      const { cost } = service.getCostAnalytics({ organizationId: ORG_A.id });
      expect(cost.totalCost).toBeCloseTo(6, 10);
      expect(cost.inputCost + cost.outputCost).toBeCloseTo(cost.totalCost, 10);
      expect(cost.costPerRun).toBeCloseTo(3, 10);
    });

    it('breaks total cost down by agent and by day without drift', () => {
      store.recordRun(
        makeRun({ date: '2026-01-01', agentId: AGENT_GEN.id, inputTokens: 100, outputTokens: 50 }),
      );
      store.recordRun(
        makeRun({
          date: '2026-01-02',
          agentId: AGENT_REVIEW.id,
          inputTokens: 1000,
          outputTokens: 100,
          inputCost: 30,
          outputCost: 4,
        }),
      );

      const { cost } = service.getCostAnalytics({ organizationId: ORG_A.id });
      const byAgentSum = Object.values(cost.costByAgent).reduce((a, b) => a + b, 0);
      const perDaySum = Object.values(cost.costPerDay).reduce((a, b) => a + b, 0);
      expect(byAgentSum).toBeCloseTo(cost.totalCost, 10);
      expect(perDaySum).toBeCloseTo(cost.totalCost, 10);
    });

    it('divides cost per active user by in-window DAU, not total org users', () => {
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A1.id, cost: 5 }));
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A2.id, cost: 5 }));

      const { cost } = service.getCostAnalytics({ organizationId: ORG_A.id });
      expect(cost.totalActiveUsers).toBe(2);
      expect(cost.costPerActiveUser).toBe(5);
    });

    it('reports all-time cost alongside the windowed total', () => {
      store.recordRun(makeRun({ date: '2025-01-01', cost: 10 }));
      store.recordRun(makeRun({ date: '2026-06-01', cost: 3 }));

      const { cost } = service.getCostAnalytics({
        organizationId: ORG_A.id,
        from: '2026-01-01',
        to: '2026-12-31',
      });

      expect(cost.totalCost).toBe(3);
      expect(cost.allTimeTotalCost).toBe(13);
    });

    it('returns zero (not NaN) for every ratio when there are no runs', () => {
      const { cost } = service.getCostAnalytics({ organizationId: ORG_A.id });
      expect(cost.costPerRun).toBe(0);
      expect(cost.costPerActiveUser).toBe(0);
      expectAllFinite(cost as unknown as Record<string, unknown>);
    });
  });

  describe('token metrics', () => {
    it('reconciles input and output tokens to per-agent and window totals', () => {
      store.recordRun(
        makeRun({ date: '2026-01-01', agentId: AGENT_GEN.id, inputTokens: 100, outputTokens: 50 }),
      );
      store.recordRun(
        makeRun({ date: '2026-01-01', agentId: AGENT_GEN.id, inputTokens: 200, outputTokens: 100 }),
      );
      store.recordRun(
        makeRun({
          date: '2026-01-02',
          agentId: AGENT_REVIEW.id,
          inputTokens: 1000,
          outputTokens: 100,
        }),
      );

      const { tokens } = service.getCostAnalytics({ organizationId: ORG_A.id });

      expect(tokens.totalInputTokens + tokens.totalOutputTokens).toBe(tokens.totalTokens);
      for (const agentId of Object.keys(tokens.tokensByAgent)) {
        expect(tokens.inputTokensByAgent[agentId] + tokens.outputTokensByAgent[agentId]).toBe(
          tokens.tokensByAgent[agentId],
        );
      }
      const sumByAgent = Object.values(tokens.tokensByAgent).reduce((a, b) => a + b, 0);
      expect(sumByAgent).toBe(tokens.totalTokens);
    });

    it('averages tokens per run using each agent’s own call count', () => {
      // agent-gen: 2 runs × 150 tokens each = 300; avg 150.
      // agent-review: 1 run × 1100 tokens = 1100; avg 1100.
      store.recordRun(makeRun({ agentId: AGENT_GEN.id, inputTokens: 100, outputTokens: 50 }));
      store.recordRun(makeRun({ agentId: AGENT_GEN.id, inputTokens: 100, outputTokens: 50 }));
      store.recordRun(
        makeRun({ agentId: AGENT_REVIEW.id, inputTokens: 1000, outputTokens: 100 }),
      );

      const { tokens } = service.getCostAnalytics({ organizationId: ORG_A.id });
      expect(tokens.avgTokensPerRunByAgent[AGENT_GEN.id]).toBe(150);
      expect(tokens.avgTokensPerRunByAgent[AGENT_REVIEW.id]).toBe(1100);
      expect(tokens.tokensPerRun).toBe((300 + 1100) / 3);
    });
  });

  describe('impact metrics', () => {
    function seedRunsAndValidations() {
      const accepted = makeRun({
        date: '2026-01-01',
        agentId: AGENT_GEN.id,
        cost: 2,
        totalTokens: 150,
        generatedLines: 40,
      });
      const rejected = makeRun({
        date: '2026-01-01',
        agentId: AGENT_GEN.id,
        cost: 3,
        totalTokens: 200,
        generatedLines: 60,
      });
      const unvalidated = makeRun({
        date: '2026-01-01',
        agentId: AGENT_REVIEW.id,
        cost: 5,
        totalTokens: 1100,
      });
      store.recordRun(accepted);
      store.recordRun(rejected);
      store.recordRun(unvalidated);

      store.recordValidation(
        accepted,
        makeValidation({ runId: accepted.id, accepted: true, validatedLines: 30 }),
      );
      store.recordValidation(rejected, makeValidation({ runId: rejected.id, accepted: false }));
      return { accepted, rejected, unvalidated };
    }

    it('computes validation rate, acceptance rate, and accepted-line ratio', () => {
      seedRunsAndValidations();
      const { impact } = service.getImpactAnalytics({ organizationId: ORG_A.id });

      expect(impact.totalCalls).toBe(3);
      expect(impact.totalValidated).toBe(2);
      expect(impact.totalAccepted).toBe(1);
      expect(impact.totalRejected).toBe(1);
      expect(impact.validationRate).toBeCloseTo(2 / 3, 10);
      expect(impact.acceptanceRate).toBe(0.5);
      // 30 validated lines out of 40 accepted generated lines.
      expect(impact.acceptedLineRatio).toBeCloseTo(30 / 40, 10);
    });

    it('reports cost per accepted and per rejected run from their respective totals', () => {
      seedRunsAndValidations();
      const { impact } = service.getImpactAnalytics({ organizationId: ORG_A.id });
      expect(impact.totalAcceptedCost).toBe(2);
      expect(impact.costPerAcceptedRun).toBe(2);
      expect(impact.totalRejectedCost).toBe(3);
      expect(impact.costPerRejectedRun).toBe(3);
    });

    it('returns 0 (not NaN) for every ratio when there are no validations', () => {
      store.recordRun(makeRun({ date: '2026-01-01' }));
      const { impact } = service.getImpactAnalytics({ organizationId: ORG_A.id });
      expect(impact.acceptanceRate).toBe(0);
      expect(impact.acceptedLineRatio).toBe(0);
      expect(impact.costPerAcceptedRun).toBe(0);
      expect(impact.costPerRejectedRun).toBe(0);
      expectAllFinite(impact as unknown as Record<string, unknown>);
    });

    it('reports 0 (not NaN) acceptance rate on days without validations', () => {
      // Day 1: 1 accepted, 1 rejected → 0.5.
      // Day 2: 1 run, no validation → 0.
      const d1Accepted = makeRun({ date: '2026-01-01' });
      const d1Rejected = makeRun({ date: '2026-01-01' });
      store.recordRun(d1Accepted);
      store.recordRun(d1Rejected);
      store.recordRun(makeRun({ date: '2026-01-02' }));
      store.recordValidation(
        d1Accepted,
        makeValidation({ runId: d1Accepted.id, accepted: true }),
      );
      store.recordValidation(
        d1Rejected,
        makeValidation({ runId: d1Rejected.id, accepted: false }),
      );

      const { impact } = service.getImpactAnalytics({ organizationId: ORG_A.id });
      expect(impact.acceptanceRatePerDay['2026-01-01']).toBe(0.5);
      expect(impact.acceptanceRatePerDay['2026-01-02']).toBe(0);
      expect(Number.isFinite(impact.acceptanceRatePerDay['2026-01-02'])).toBe(true);
    });

    it('ignores validated lines for agents that do not generate code', () => {
      // AGENT_REVIEW has generatesLines = false — runs never carry generatedLines,
      // so validatedLines must stay 0 regardless of what the validator tried to claim.
      const run = makeRun({ agentId: AGENT_REVIEW.id, generatedLines: undefined });
      store.recordRun(run);
      store.recordValidation(run, makeValidation({ runId: run.id, accepted: true }));

      const { impact } = service.getImpactAnalytics({ organizationId: ORG_A.id });
      expect(impact.totalValidatedLines).toBe(0);
      expect(impact.acceptedGeneratedLines).toBe(0);
      expect(impact.acceptedLineRatio).toBe(0);
    });
  });

  describe('user ranking', () => {
    beforeEach(() => {
      // 3 runs by user A1, 2 by A2, 1 by A3.
      for (let i = 0; i < 3; i++) store.recordRun(makeRun({ userId: USER_A1.id, cost: 2 }));
      for (let i = 0; i < 2; i++) store.recordRun(makeRun({ userId: USER_A2.id, cost: 1 }));
      store.recordRun(makeRun({ userId: USER_A3.id, cost: 0.5 }));
    });

    it('ranks users by total calls and resolves their display names', () => {
      const ranking = service.getUserRanking({ organizationId: ORG_A.id });
      expect(ranking.map((r) => r.userId)).toEqual([USER_A1.id, USER_A2.id, USER_A3.id]);
      expect(ranking[0].userName).toBe('Alice');
      expect(ranking[0].calls).toBe(3);
    });

    it('respects the limit parameter', () => {
      const ranking = service.getUserRanking({ organizationId: ORG_A.id, limit: 2 });
      expect(ranking).toHaveLength(2);
      expect(ranking.map((r) => r.userId)).toEqual([USER_A1.id, USER_A2.id]);
    });

    it('ranks users by a single agent’s call count and excludes non-users of that agent', () => {
      // A2 calls review, A1 and A3 do not.
      store.recordRun(makeRun({ userId: USER_A2.id, agentId: AGENT_REVIEW.id }));
      const ranking = service.getUserRanking({
        organizationId: ORG_A.id,
        rankBy: AGENT_REVIEW.id,
      });

      expect(ranking[0].userId).toBe(USER_A2.id);
      expect(ranking[0].calls).toBe(1);
      // Users with zero calls to the target agent are filtered out.
      expect(ranking.map((r) => r.userId)).not.toContain(USER_A3.id);
    });
  });

  describe('latency metrics', () => {
    it('returns a null p95 until enough samples are collected', () => {
      store.recordRun(makeRun({ agentId: AGENT_GEN.id, latency: 500 }));
      const { latency } = service.getCostAnalytics({ organizationId: ORG_A.id });
      expect(latency.p95Ms).toBeNull();
      expect(latency.byAgent[AGENT_GEN.id].p95Ms).toBeNull();
    });

    it('reports a stable p95 once enough samples are collected', () => {
      // 19 @ 300ms, 1 @ 3000ms — with ≥20 samples the p95 bucket should land near 300ms.
      for (let i = 0; i < 19; i++) store.recordRun(makeRun({ agentId: AGENT_GEN.id, latency: 300 }));
      store.recordRun(makeRun({ agentId: AGENT_GEN.id, latency: 3000 }));

      const { latency } = service.getCostAnalytics({ organizationId: ORG_A.id });
      expect(latency.byAgent[AGENT_GEN.id].p95Ms).not.toBeNull();
      // 95% target falls inside the 300ms bucket; upper edge = 400ms.
      expect(latency.byAgent[AGENT_GEN.id].p95Ms).toBe(400);
      expect(latency.avgMs).toBeGreaterThan(0);
    });
  });
});
