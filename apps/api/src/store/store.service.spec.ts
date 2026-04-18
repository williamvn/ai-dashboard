import { AGENT_GEN, AGENT_REVIEW } from '../../test/fixtures/agents';
import { makeRun, makeValidation, resetRunSeq } from '../../test/fixtures/builders';
import { ORG_A, ORG_B, USER_A1, USER_A2, USER_B1 } from '../../test/fixtures/orgs';
import { makeStore } from '../../test/fixtures/store';
import {
  LATENCY_BUCKET_MS,
  latencyBucketIndex,
  newLatencyHistogram,
  StoreService,
} from './store.service';

describe('StoreService', () => {
  let store: StoreService;

  beforeEach(() => {
    resetRunSeq();
    store = makeStore();
  });

  describe('recordRun — write-time aggregation', () => {
    it('buckets runs by UTC calendar date derived from timestamp', () => {
      store.recordRun(makeRun({ date: '2026-01-01' }));
      store.recordRun(makeRun({ date: '2026-01-02' }));
      store.recordRun(makeRun({ date: '2026-01-02' }));

      const days = store.getOrgDays(ORG_A.id);
      expect(days.map((d) => d.date)).toEqual(['2026-01-01', '2026-01-02']);
      expect(days[0].calls).toBe(1);
      expect(days[1].calls).toBe(2);
    });

    it('accumulates tokens, cost, and split in/out cost on the day bucket', () => {
      store.recordRun(
        makeRun({ date: '2026-01-01', inputTokens: 100, outputTokens: 50 }),
      );
      store.recordRun(
        makeRun({ date: '2026-01-01', inputTokens: 200, outputTokens: 100 }),
      );

      const [day] = store.getOrgDays(ORG_A.id);
      expect(day.inputTokens).toBe(300);
      expect(day.outputTokens).toBe(150);
      expect(day.totalTokens).toBe(450);
      expect(day.inputCost).toBeCloseTo(3.0, 10);
      expect(day.outputCost).toBeCloseTo(3.0, 10);
      expect(day.cost).toBeCloseTo(6.0, 10);
    });

    it('tracks active users as a set — same user on same day counts once', () => {
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A1.id }));
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A1.id }));
      store.recordRun(makeRun({ date: '2026-01-01', userId: USER_A2.id }));

      const [day] = store.getOrgDays(ORG_A.id);
      expect(day.activeUsers.size).toBe(2);
      expect(day.calls).toBe(3);
    });

    it('partitions stats by agent within a bucket', () => {
      store.recordRun(makeRun({ date: '2026-01-01', agentId: AGENT_GEN.id, inputTokens: 100 }));
      store.recordRun(
        makeRun({
          date: '2026-01-01',
          agentId: AGENT_REVIEW.id,
          inputTokens: 1000,
          outputTokens: 100,
          inputCost: 30,
          outputCost: 4,
        }),
      );

      const [day] = store.getOrgDays(ORG_A.id);
      expect(day.byAgent[AGENT_GEN.id].calls).toBe(1);
      expect(day.byAgent[AGENT_GEN.id].inputTokens).toBe(100);
      expect(day.byAgent[AGENT_REVIEW.id].calls).toBe(1);
      expect(day.byAgent[AGENT_REVIEW.id].inputTokens).toBe(1000);
      expect(day.byAgent[AGENT_REVIEW.id].inputCost).toBe(30);
    });

    it('partitions stats by user within a bucket, with per-agent call counts', () => {
      store.recordRun(
        makeRun({ date: '2026-01-01', userId: USER_A1.id, agentId: AGENT_GEN.id }),
      );
      store.recordRun(
        makeRun({ date: '2026-01-01', userId: USER_A1.id, agentId: AGENT_GEN.id }),
      );
      store.recordRun(
        makeRun({ date: '2026-01-01', userId: USER_A1.id, agentId: AGENT_REVIEW.id }),
      );

      const [day] = store.getOrgDays(ORG_A.id);
      expect(day.byUser[USER_A1.id].calls).toBe(3);
      expect(day.byUser[USER_A1.id].callsByAgent).toEqual({
        [AGENT_GEN.id]: 2,
        [AGENT_REVIEW.id]: 1,
      });
    });

    it('drops latency samples into the correct histogram bucket', () => {
      // 500ms → bucket 5; 1500ms → bucket 15.
      store.recordRun(makeRun({ latency: 500 }));
      store.recordRun(makeRun({ latency: 1500 }));

      const [day] = store.getOrgDays(ORG_A.id);
      const { latencyHistogram, latencySum, latencyCount } = day.byAgent[AGENT_GEN.id];
      expect(latencyHistogram[5]).toBe(1);
      expect(latencyHistogram[15]).toBe(1);
      expect(latencySum).toBe(2000);
      expect(latencyCount).toBe(2);
    });

    it('updates all-time totals independently of the date window', () => {
      store.recordRun(makeRun({ date: '2025-01-01', cost: 5 }));
      store.recordRun(makeRun({ date: '2026-06-01', cost: 7 }));

      const stats = store.getOrgWindowStats(ORG_A.id, '2026-01-01', '2026-12-31')!;
      expect(stats.totalCost).toBe(7);
      expect(stats.allTimeTotalCost).toBe(12);
    });

    it('isolates aggregates between organizations', () => {
      store.recordRun(makeRun({ organizationId: ORG_A.id, userId: USER_A1.id }));
      store.recordRun(makeRun({ organizationId: ORG_B.id, userId: USER_B1.id }));

      expect(store.getOrgDays(ORG_A.id)).toHaveLength(1);
      expect(store.getOrgDays(ORG_B.id)).toHaveLength(1);
      expect(store.getOrgWindowStats(ORG_A.id)!.totalCalls).toBe(1);
      expect(store.getOrgWindowStats(ORG_B.id)!.totalCalls).toBe(1);
    });
  });

  describe('recordValidation', () => {
    it('accumulates accepted/rejected counts plus derived cost/token/line totals', () => {
      const run1 = makeRun({ date: '2026-01-01', cost: 10, totalTokens: 200, generatedLines: 40 });
      const run2 = makeRun({ date: '2026-01-01', cost: 3, totalTokens: 60, generatedLines: 20 });
      store.recordRun(run1);
      store.recordRun(run2);

      store.recordValidation(run1, makeValidation({ runId: run1.id, accepted: true, validatedLines: 30 }));
      store.recordValidation(run2, makeValidation({ runId: run2.id, accepted: false }));

      const stats = store.getOrgWindowStats(ORG_A.id)!;
      expect(stats.totalValidated).toBe(2);
      expect(stats.totalAccepted).toBe(1);
      expect(stats.totalRejected).toBe(1);
      expect(stats.totalAcceptedCost).toBe(10);
      expect(stats.totalRejectedCost).toBe(3);
      expect(stats.totalAcceptedTokens).toBe(200);
      expect(stats.totalAcceptedGeneratedLines).toBe(40);
      expect(stats.totalValidatedLines).toBe(30);
    });

    it('treats a missing validatedLines as zero (no NaN leak)', () => {
      const run = makeRun({ generatedLines: 10 });
      store.recordRun(run);
      store.recordValidation(run, makeValidation({ runId: run.id, accepted: true }));

      const agent = store.getOrgWindowStats(ORG_A.id)!.byAgent[AGENT_GEN.id];
      expect(agent.validatedLines).toBe(0);
      expect(agent.acceptedGeneratedLines).toBe(10);
    });

    it('no-ops when the run belongs to an org without an aggregate', () => {
      const orphan = makeRun({ organizationId: 'org-missing' });
      expect(() =>
        store.recordValidation(orphan, makeValidation({ runId: orphan.id, accepted: true })),
      ).not.toThrow();
      expect(store.validations.get(orphan.id)).toBeDefined();
    });
  });

  describe('getOrgDays / getOrgWindowStats', () => {
    beforeEach(() => {
      store.recordRun(makeRun({ date: '2026-01-01', cost: 1 }));
      store.recordRun(makeRun({ date: '2026-01-03', cost: 2 }));
      store.recordRun(makeRun({ date: '2026-01-05', cost: 4 }));
    });

    it('returns days sorted ascending', () => {
      const dates = store.getOrgDays(ORG_A.id).map((d) => d.date);
      expect(dates).toEqual(['2026-01-01', '2026-01-03', '2026-01-05']);
    });

    it('filters inclusively on both ends of the window', () => {
      const dates = store.getOrgDays(ORG_A.id, '2026-01-03', '2026-01-05').map((d) => d.date);
      expect(dates).toEqual(['2026-01-03', '2026-01-05']);
    });

    it('applies the same window filter to getOrgWindowStats totals', () => {
      const stats = store.getOrgWindowStats(ORG_A.id, '2026-01-03', '2026-01-05')!;
      expect(stats.totalCalls).toBe(2);
      expect(stats.totalCost).toBe(6);
    });

    it('returns an empty array and undefined stats for an unknown org', () => {
      expect(store.getOrgDays('unknown')).toEqual([]);
      expect(store.getOrgWindowStats('unknown')).toBeUndefined();
    });
  });

  describe('clearOrgData', () => {
    it('removes runs, validations, and aggregates for the target org only', () => {
      const runA = makeRun({ organizationId: ORG_A.id, userId: USER_A1.id });
      const runB = makeRun({ organizationId: ORG_B.id, userId: USER_B1.id });
      store.recordRun(runA);
      store.recordRun(runB);
      store.recordValidation(runA, makeValidation({ runId: runA.id, accepted: true }));

      const { runsRemoved } = store.clearOrgData(ORG_A.id);

      expect(runsRemoved).toBe(1);
      expect(store.findRunById(runA.id)).toBeUndefined();
      expect(store.validations.get(runA.id)).toBeUndefined();
      expect(store.getOrgWindowStats(ORG_A.id)).toBeUndefined();
      // Org B remains untouched.
      expect(store.findRunById(runB.id)).toBeDefined();
      expect(store.getOrgWindowStats(ORG_B.id)!.totalCalls).toBe(1);
    });

    it('is a no-op when no runs exist for the org', () => {
      expect(store.clearOrgData(ORG_A.id)).toEqual({ runsRemoved: 0 });
    });
  });

  describe('lookups', () => {
    it('orgExists / getUserCountForOrg reflect seeded data', () => {
      expect(store.orgExists(ORG_A.id)).toBe(true);
      expect(store.orgExists('missing')).toBe(false);
      expect(store.getUserCountForOrg(ORG_A.id)).toBe(3);
      expect(store.getUserCountForOrg(ORG_B.id)).toBe(1);
    });

    it('findUserById / findAgentById resolve by id', () => {
      expect(store.findUserById(USER_A1.id)?.name).toBe('Alice');
      expect(store.findAgentById(AGENT_GEN.id)?.name).toBe('Line Generator');
      expect(store.findUserById('missing')).toBeUndefined();
    });
  });

  describe('latency helpers', () => {
    it('latencyBucketIndex clamps negatives to 0 and overflow to the last bucket', () => {
      expect(latencyBucketIndex(0)).toBe(0);
      expect(latencyBucketIndex(LATENCY_BUCKET_MS * 3 + 10)).toBe(3);
      expect(latencyBucketIndex(-50)).toBe(0);
      expect(latencyBucketIndex(9_999_999)).toBe(newLatencyHistogram().length - 1);
    });
  });
});
