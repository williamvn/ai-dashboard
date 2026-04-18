import { Injectable } from '@nestjs/common';
import type { Agent, AgentRun, Organization, User, ValidationEvent } from '@repo/types';

/**
 * Latency histogram: 100 buckets of 100ms covering 0–10s, with the last bucket
 * acting as an overflow catch-all. Agent profiles peak at ~6.5s so this resolves
 * p95 within 100ms — well inside the noise floor of a synthetic signal.
 *
 * Kept inside AgentStats so window p95 is an O(buckets) walk over the summed
 * histogram instead of an O(N log N) sort of raw samples.
 */
export const LATENCY_BUCKET_MS = 100;
export const LATENCY_BUCKET_COUNT = 100;

export function newLatencyHistogram(): number[] {
  return new Array(LATENCY_BUCKET_COUNT).fill(0);
}

export function latencyBucketIndex(ms: number): number {
  const idx = Math.floor(ms / LATENCY_BUCKET_MS);
  if (idx < 0) return 0;
  if (idx >= LATENCY_BUCKET_COUNT) return LATENCY_BUCKET_COUNT - 1;
  return idx;
}

export interface AgentStats {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  inputCost: number;
  outputCost: number;
  generatedLines: number;
  accepted: number;
  rejected: number;
  validatedLines: number;
  latencySum: number;
  latencyCount: number;
  latencyHistogram: number[];
}

export interface UserStats {
  calls: number;
  totalTokens: number;
  cost: number;
  callsByAgent: Record<string, number>;
}

export interface DayBucket {
  date: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  inputCost: number;
  outputCost: number;
  generatedLines: number;
  activeUsers: Set<string>;
  byAgent: Record<string, AgentStats>;
  byUser: Record<string, UserStats>;
}

export interface OrgAggregate {
  organizationId: string;
  days: Record<string, DayBucket>;
  allTimeTotalCost: number;
  allTimeTotalRuns: number;
}

export interface WindowStats {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  totalInputCost: number;
  totalOutputCost: number;
  totalGeneratedLines: number;
  totalValidated: number;
  totalAccepted: number;
  totalRejected: number;
  totalValidatedLines: number;
  /** Unique users with at least one run inside the window. */
  activeUsers: Set<string>;
  byAgent: Record<string, AgentStats>;
  byUser: Record<string, UserStats>;
  windowDays: number;
  /** Carried through so the cost builder doesn't need a second store lookup. */
  allTimeTotalCost: number;
}

@Injectable()
export class StoreService {
  readonly organizations: Organization[] = [];
  readonly users: User[] = [];
  readonly agents: Agent[] = [];
  readonly runs: Map<string, AgentRun> = new Map();
  readonly validations: Map<string, ValidationEvent> = new Map();
  readonly aggregates: Map<string, OrgAggregate> = new Map();

  // ---------------------------------------------------------------------------
  // Write-time aggregation
  // ---------------------------------------------------------------------------

  recordRun(run: AgentRun): void {
    this.runs.set(run.id, run);

    const agg = this.getOrCreateAggregate(run.organizationId);
    const bucket = this.getOrCreateDayBucket(agg, toDateKey(run.timestamp));

    bucket.calls++;
    bucket.inputTokens += run.inputTokens;
    bucket.outputTokens += run.outputTokens;
    bucket.totalTokens += run.totalTokens;
    bucket.cost += run.cost;
    bucket.inputCost += run.inputCost;
    bucket.outputCost += run.outputCost;
    bucket.activeUsers.add(run.userId);
    if (run.generatedLines !== undefined) bucket.generatedLines += run.generatedLines;

    incrementAgentStats(bucket.byAgent, run);
    incrementUserStats(bucket.byUser, run);

    agg.allTimeTotalCost += run.cost;
    agg.allTimeTotalRuns++;
  }

  recordValidation(run: AgentRun, event: ValidationEvent): void {
    this.validations.set(run.id, event);

    const agg = this.aggregates.get(run.organizationId);
    if (!agg) return;

    const bucket = agg.days[toDateKey(run.timestamp)];
    if (bucket) applyValidationToAgentStats(bucket.byAgent, run.agentId, event, event.validatedLines ?? 0);
  }

  // ---------------------------------------------------------------------------
  // Query wrappers
  // ---------------------------------------------------------------------------

  getOrgDays(orgId: string, from?: string, to?: string): DayBucket[] {
    const agg = this.aggregates.get(orgId);
    if (!agg) return [];

    return Object.values(agg.days)
      .filter((b) => (!from || b.date >= from) && (!to || b.date <= to))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getOrgWindowStats(orgId: string, from?: string, to?: string): WindowStats | undefined {
    const agg = this.aggregates.get(orgId);
    if (!agg) return undefined;
    const stats = sumDaysToWindowStats(this.getOrgDays(orgId, from, to));
    stats.allTimeTotalCost = agg.allTimeTotalCost;
    return stats;
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  clearOrgData(orgId: string): { runsRemoved: number } {
    let runsRemoved = 0;

    for (const [id, run] of this.runs) {
      if (run.organizationId === orgId) {
        this.runs.delete(id);
        this.validations.delete(id);
        runsRemoved++;
      }
    }

    this.aggregates.delete(orgId);

    return { runsRemoved };
  }

  // ---------------------------------------------------------------------------
  // Lookups
  // ---------------------------------------------------------------------------

  findRunById(id: string): AgentRun | undefined {
    return this.runs.get(id);
  }

  findAgentById(id: string): Agent | undefined {
    return this.agents.find((a) => a.id === id);
  }

  findUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  orgExists(orgId: string): boolean {
    return this.organizations.some((o) => o.id === orgId);
  }

  getUserCountForOrg(orgId: string): number {
    return this.users.filter((u) => u.organizationId === orgId).length;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private getOrCreateAggregate(organizationId: string): OrgAggregate {
    let agg = this.aggregates.get(organizationId);
    if (!agg) {
      agg = { organizationId, days: {}, allTimeTotalCost: 0, allTimeTotalRuns: 0 };
      this.aggregates.set(organizationId, agg);
    }
    return agg;
  }

  private getOrCreateDayBucket(agg: OrgAggregate, date: string): DayBucket {
    if (!agg.days[date]) {
      agg.days[date] = {
        date,
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        inputCost: 0,
        outputCost: 0,
        generatedLines: 0,
        activeUsers: new Set(),
        byAgent: {},
        byUser: {},
      };
    }
    return agg.days[date];
  }
}

// ---------------------------------------------------------------------------
// Module-level pure helpers
// ---------------------------------------------------------------------------

function toDateKey(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

function emptyAgentStats(): AgentStats {
  return {
    calls: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    cost: 0,
    inputCost: 0,
    outputCost: 0,
    generatedLines: 0,
    accepted: 0,
    rejected: 0,
    validatedLines: 0,
    latencySum: 0,
    latencyCount: 0,
    latencyHistogram: newLatencyHistogram(),
  };
}

function emptyUserStats(): UserStats {
  return { calls: 0, totalTokens: 0, cost: 0, callsByAgent: {} };
}

function incrementAgentStats(map: Record<string, AgentStats>, run: AgentRun): void {
  if (!map[run.agentId]) map[run.agentId] = emptyAgentStats();
  const s = map[run.agentId];
  s.calls++;
  s.inputTokens += run.inputTokens;
  s.outputTokens += run.outputTokens;
  s.totalTokens += run.totalTokens;
  s.cost += run.cost;
  s.inputCost += run.inputCost;
  s.outputCost += run.outputCost;
  s.latencySum += run.latency;
  s.latencyCount++;
  s.latencyHistogram[latencyBucketIndex(run.latency)]++;
  if (run.generatedLines !== undefined) s.generatedLines += run.generatedLines;
}

function incrementUserStats(map: Record<string, UserStats>, run: AgentRun): void {
  if (!map[run.userId]) map[run.userId] = emptyUserStats();
  const s = map[run.userId];
  s.calls++;
  s.totalTokens += run.totalTokens;
  s.cost += run.cost;
  s.callsByAgent[run.agentId] = (s.callsByAgent[run.agentId] ?? 0) + 1;
}

function applyValidationToAgentStats(
  map: Record<string, AgentStats>,
  agentId: string,
  event: ValidationEvent,
  lines: number,
): void {
  if (!map[agentId]) map[agentId] = emptyAgentStats();
  const s = map[agentId];
  if (event.accepted) {
    s.accepted++;
    s.validatedLines += lines;
  } else {
    s.rejected++;
  }
}

function sumDaysToWindowStats(days: DayBucket[]): WindowStats {
  const byAgent: Record<string, AgentStats> = {};
  const byUser: Record<string, UserStats> = {};
  const activeUsers = new Set<string>();
  let totalCalls = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalTokens = 0;
  let totalCost = 0;
  let totalInputCost = 0;
  let totalOutputCost = 0;
  let totalGeneratedLines = 0;
  let totalValidated = 0;
  let totalAccepted = 0;
  let totalRejected = 0;
  let totalValidatedLines = 0;

  for (const bucket of days) {
    totalCalls += bucket.calls;
    totalInputTokens += bucket.inputTokens;
    totalOutputTokens += bucket.outputTokens;
    totalTokens += bucket.totalTokens;
    totalCost += bucket.cost;
    totalInputCost += bucket.inputCost;
    totalOutputCost += bucket.outputCost;
    totalGeneratedLines += bucket.generatedLines;
    for (const u of bucket.activeUsers) activeUsers.add(u);

    for (const [agentId, s] of Object.entries(bucket.byAgent)) {
      if (!byAgent[agentId]) byAgent[agentId] = emptyAgentStats();
      const t = byAgent[agentId];
      t.calls += s.calls;
      t.inputTokens += s.inputTokens;
      t.outputTokens += s.outputTokens;
      t.totalTokens += s.totalTokens;
      t.cost += s.cost;
      t.inputCost += s.inputCost;
      t.outputCost += s.outputCost;
      t.generatedLines += s.generatedLines;
      t.accepted += s.accepted;
      t.rejected += s.rejected;
      t.validatedLines += s.validatedLines;
      t.latencySum += s.latencySum;
      t.latencyCount += s.latencyCount;
      for (let i = 0; i < LATENCY_BUCKET_COUNT; i++) {
        t.latencyHistogram[i] += s.latencyHistogram[i];
      }
      totalValidated += s.accepted + s.rejected;
      totalAccepted += s.accepted;
      totalRejected += s.rejected;
      totalValidatedLines += s.validatedLines;
    }

    for (const [userId, s] of Object.entries(bucket.byUser)) {
      if (!byUser[userId]) byUser[userId] = emptyUserStats();
      const t = byUser[userId];
      t.calls += s.calls;
      t.totalTokens += s.totalTokens;
      t.cost += s.cost;
      for (const [agentId, calls] of Object.entries(s.callsByAgent)) {
        t.callsByAgent[agentId] = (t.callsByAgent[agentId] ?? 0) + calls;
      }
    }
  }

  return {
    totalCalls,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCost,
    totalInputCost,
    totalOutputCost,
    totalGeneratedLines,
    totalValidated,
    totalAccepted,
    totalRejected,
    totalValidatedLines,
    activeUsers,
    byAgent,
    byUser,
    windowDays: days.length,
    // Populated by getOrgWindowStats once the org aggregate is known. Defaults
    // to 0 so callers that synthesize an empty WindowStats stay type-safe.
    allTimeTotalCost: 0,
  };
}
