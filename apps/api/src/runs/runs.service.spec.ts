import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Agent, TaskLevel } from '@repo/types';
import { AgentsService } from '../agents/agents.service';
import { StoreService } from '../store/store.service';
import { AGENT_GEN, AGENT_REVIEW } from '../../test/fixtures/agents';
import { resetRunSeq } from '../../test/fixtures/builders';
import { USER_A1, USER_B1 } from '../../test/fixtures/orgs';
import { makeStore } from '../../test/fixtures/store';
import { RunsService } from './runs.service';

/**
 * Thin wrapper around StoreService so we get the real AgentsService.findById
 * resolution without bootstrapping a Nest module. Constructor wiring mirrors
 * production exactly.
 */
function makeService(store: StoreService) {
  const agents = new AgentsService(store);
  return new RunsService(store, agents);
}

const TASK_LEVELS: TaskLevel[] = ['easy', 'medium', 'hard'];

describe('RunsService', () => {
  let store: StoreService;
  let service: RunsService;

  beforeEach(() => {
    resetRunSeq();
    store = makeStore();
    service = makeService(store);
  });

  describe('runAgent — cost derivation', () => {
    it('derives cost as inputTokens × inputTokenPrice + outputTokens × outputTokenPrice', () => {
      // AGENT_GEN easy: always 100 in / 50 out (fixture uses collapsed ranges).
      // Cost = 100 × 0.01 + 50 × 0.02 = 2.0.
      const response = service.runAgent({
        userId: USER_A1.id,
        agentId: AGENT_GEN.id,
        taskLevel: 'easy',
      });

      expect(response.inputTokens).toBe(100);
      expect(response.outputTokens).toBe(50);
      expect(response.totalTokens).toBe(150);
      expect(response.cost).toBeCloseTo(2.0, 10);

      const stored = store.findRunById(response.runId)!;
      expect(stored.inputCost).toBeCloseTo(1.0, 10);
      expect(stored.outputCost).toBeCloseTo(1.0, 10);
      expect(stored.inputCost + stored.outputCost).toBeCloseTo(stored.cost, 10);
    });

    it('uses the task-level pricing profile — harder tasks cost more', () => {
      const costs = TASK_LEVELS.map((taskLevel) => {
        const { cost } = service.runAgent({
          userId: USER_A1.id,
          agentId: AGENT_GEN.id,
          taskLevel,
        });
        return cost;
      });

      expect(costs[0]).toBeLessThan(costs[1]);
      expect(costs[1]).toBeLessThan(costs[2]);
    });
  });

  describe('runAgent — token sampling', () => {
    const WIDE_AGENT: Agent = {
      id: 'agent-wide',
      name: 'Wide Range',
      generatesLines: false,
      inputTokenPrice: 0.001,
      outputTokenPrice: 0.001,
      tokenProfile: {
        easy: { inputMin: 10, inputMax: 100, outputMin: 10, outputMax: 100 },
        medium: { inputMin: 10, inputMax: 100, outputMin: 10, outputMax: 100 },
        hard: { inputMin: 10, inputMax: 100, outputMin: 10, outputMax: 100 },
      },
      latency: { easy: 100, medium: 100, hard: 100 },
    };

    beforeEach(() => {
      store.agents.push(WIDE_AGENT);
    });

    it('samples input/output tokens within the profile range on every call', () => {
      for (let i = 0; i < 50; i++) {
        const res = service.runAgent({
          userId: USER_A1.id,
          agentId: WIDE_AGENT.id,
          taskLevel: 'easy',
        });
        expect(res.inputTokens).toBeGreaterThanOrEqual(10);
        expect(res.inputTokens).toBeLessThanOrEqual(100);
        expect(res.outputTokens).toBeGreaterThanOrEqual(10);
        expect(res.outputTokens).toBeLessThanOrEqual(100);
        expect(res.totalTokens).toBe(res.inputTokens + res.outputTokens);
      }
    });
  });

  describe('runAgent — generatedLines gating', () => {
    it('is populated when the agent has generatesLines = true', () => {
      const res = service.runAgent({
        userId: USER_A1.id,
        agentId: AGENT_GEN.id,
        taskLevel: 'easy',
      });
      expect(res.generatedLines).toBeGreaterThanOrEqual(10);
      expect(res.generatedLines).toBeLessThanOrEqual(60);
    });

    it('is omitted when the agent has generatesLines = false', () => {
      const res = service.runAgent({
        userId: USER_A1.id,
        agentId: AGENT_REVIEW.id,
        taskLevel: 'easy',
      });
      expect(res.generatedLines).toBeUndefined();

      const stored = store.findRunById(res.runId)!;
      expect(stored.generatedLines).toBeUndefined();
    });
  });

  describe('runAgent — persistence and attribution', () => {
    it('persists the run under the user’s organization, not a caller-supplied one', () => {
      const res = service.runAgent({
        userId: USER_A1.id,
        agentId: AGENT_GEN.id,
        taskLevel: 'easy',
      });
      const stored = store.findRunById(res.runId)!;
      expect(stored.organizationId).toBe(USER_A1.organizationId);
    });

    it('records latency from the agent’s task-level latency profile', () => {
      const res = service.runAgent({
        userId: USER_A1.id,
        agentId: AGENT_GEN.id,
        taskLevel: 'medium',
      });
      expect(res.latency).toBe(AGENT_GEN.latency.medium);
    });

    it('uses the caller-supplied timestamp when provided', () => {
      const ts = Date.parse('2026-02-15T12:00:00Z');
      const res = service.runAgent({
        userId: USER_A1.id,
        agentId: AGENT_GEN.id,
        taskLevel: 'easy',
        timestamp: ts,
      });
      expect(store.findRunById(res.runId)!.timestamp).toBe(ts);
    });
  });

  describe('runAgent — error paths', () => {
    it('throws NotFoundException for an unknown agent', () => {
      expect(() =>
        service.runAgent({ userId: USER_A1.id, agentId: 'missing', taskLevel: 'easy' }),
      ).toThrow(NotFoundException);
    });

    it('throws NotFoundException for an unknown user', () => {
      expect(() =>
        service.runAgent({ userId: 'missing', agentId: AGENT_GEN.id, taskLevel: 'easy' }),
      ).toThrow(NotFoundException);
    });
  });

  describe('validateOutput', () => {
    function seedRun(opts: { agentId?: string; taskLevel?: TaskLevel } = {}) {
      const { runId } = service.runAgent({
        userId: USER_A1.id,
        agentId: opts.agentId ?? AGENT_GEN.id,
        taskLevel: opts.taskLevel ?? 'easy',
      });
      return runId;
    }

    it('records an accepted validation with kept-lines count', () => {
      const runId = seedRun();
      const res = service.validateOutput({ runId, accepted: true, validatedLines: 5 });
      expect(res.success).toBe(true);
      expect(store.validations.get(runId)).toEqual({
        runId,
        accepted: true,
        validatedLines: 5,
      });
    });

    it('records a rejection without validatedLines', () => {
      const runId = seedRun();
      service.validateOutput({ runId, accepted: false });
      expect(store.validations.get(runId)?.accepted).toBe(false);
    });

    it('throws NotFound when the run does not exist', () => {
      expect(() => service.validateOutput({ runId: 'missing', accepted: true })).toThrow(
        NotFoundException,
      );
    });

    it('rejects duplicate validations for the same run', () => {
      const runId = seedRun();
      service.validateOutput({ runId, accepted: true });
      expect(() => service.validateOutput({ runId, accepted: false })).toThrow(
        BadRequestException,
      );
    });

    it('rejects validatedLines when accepted = false', () => {
      const runId = seedRun();
      expect(() =>
        service.validateOutput({ runId, accepted: false, validatedLines: 3 }),
      ).toThrow(BadRequestException);
    });

    it('rejects validatedLines for runs that did not generate lines', () => {
      const runId = seedRun({ agentId: AGENT_REVIEW.id });
      expect(() =>
        service.validateOutput({ runId, accepted: true, validatedLines: 1 }),
      ).toThrow(BadRequestException);
    });

    it('rejects validatedLines exceeding the run’s generatedLines', () => {
      const runId = seedRun();
      const generated = store.findRunById(runId)!.generatedLines!;
      expect(() =>
        service.validateOutput({ runId, accepted: true, validatedLines: generated + 1 }),
      ).toThrow(BadRequestException);
    });
  });

  describe('aggregate wiring', () => {
    it('runAgent + validateOutput flow through to the org aggregate', () => {
      const { runId } = service.runAgent({
        userId: USER_A1.id,
        agentId: AGENT_GEN.id,
        taskLevel: 'easy',
      });
      service.validateOutput({ runId, accepted: true, validatedLines: 3 });

      const stats = store.getOrgWindowStats(USER_A1.organizationId)!;
      expect(stats.totalCalls).toBe(1);
      expect(stats.totalAccepted).toBe(1);
      expect(stats.totalValidatedLines).toBe(3);
      expect(stats.totalCost).toBeCloseTo(2.0, 10);
    });

    it('does not leak runs across organizations', () => {
      service.runAgent({ userId: USER_A1.id, agentId: AGENT_GEN.id, taskLevel: 'easy' });
      service.runAgent({ userId: USER_B1.id, agentId: AGENT_GEN.id, taskLevel: 'easy' });

      expect(store.getOrgWindowStats(USER_A1.organizationId)!.totalCalls).toBe(1);
      expect(store.getOrgWindowStats(USER_B1.organizationId)!.totalCalls).toBe(1);
    });
  });
});
