import { Injectable } from '@nestjs/common';
import type { Agent, AgentRun, Organization, User, UserAction } from '@repo/types';

export interface AgentStats {
  calls: number;
  cost: number;
  generatedLines: number;
  accepted: number;
  rejected: number;
  acceptedLines: number;
}

export interface DayBucket {
  date: string;
  calls: number;
  cost: number;
  generatedLines: number;
  activeUsers: Set<string>;
  byAgent: Record<string, AgentStats>;
}

export interface OrgAggregate {
  organizationId: string;
  totalCalls: number;
  totalCost: number;
  totalGeneratedLines: number;
  totalAccepted: number;
  totalRejected: number;
  totalAcceptedLines: number;
  days: Record<string, DayBucket>;
  byAgent: Record<string, AgentStats>;
}

export interface WindowStats {
  totalCalls: number;
  totalCost: number;
  totalGeneratedLines: number;
  totalAccepted: number;
  totalRejected: number;
  totalAcceptedLines: number;
  byAgent: Record<string, AgentStats>;
}

@Injectable()
export class StoreService {
  readonly organizations: Organization[] = [];
  readonly users: User[] = [];
  readonly agents: Agent[] = [];
  readonly runs: Map<string, AgentRun> = new Map();
  readonly actions: Map<string, UserAction> = new Map();
  readonly aggregates: Map<string, OrgAggregate> = new Map();

  // ---------------------------------------------------------------------------
  // Write-time aggregation
  // ---------------------------------------------------------------------------

  recordRun(run: AgentRun): void {
    this.runs.set(run.id, run);

    const agg = this.getOrCreateAggregate(run.organizationId);
    const day = toDateKey(run.timestamp);
    const bucket = this.getOrCreateDayBucket(agg, day);

    agg.totalCalls++;
    agg.totalCost += run.cost;
    if (run.generatedLines !== undefined) agg.totalGeneratedLines += run.generatedLines;

    bucket.calls++;
    bucket.cost += run.cost;
    bucket.activeUsers.add(run.userId);
    if (run.generatedLines !== undefined) bucket.generatedLines += run.generatedLines;

    incrementAgentStats(agg.byAgent, run);
    incrementAgentStats(bucket.byAgent, run);
  }

  recordAction(run: AgentRun, action: UserAction): void {
    this.actions.set(run.id, action);

    const agg = this.aggregates.get(run.organizationId);
    if (!agg) return;

    const lines = action.acceptedLines ?? run.generatedLines ?? 0;

    if (action.accepted) {
      agg.totalAccepted++;
      agg.totalAcceptedLines += lines;
    } else {
      agg.totalRejected++;
    }

    applyActionToAgentStats(agg.byAgent, run.agentId, action, lines);

    const bucket = agg.days[toDateKey(run.timestamp)];
    if (bucket) applyActionToAgentStats(bucket.byAgent, run.agentId, action, lines);
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

    if (!from && !to) {
      return {
        totalCalls: agg.totalCalls,
        totalCost: agg.totalCost,
        totalGeneratedLines: agg.totalGeneratedLines,
        totalAccepted: agg.totalAccepted,
        totalRejected: agg.totalRejected,
        totalAcceptedLines: agg.totalAcceptedLines,
        byAgent: agg.byAgent,
      };
    }

    return sumDaysToWindowStats(this.getOrgDays(orgId, from, to));
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  clearOrgData(orgId: string): { runsRemoved: number } {
    let runsRemoved = 0;

    for (const [id, run] of this.runs) {
      if (run.organizationId === orgId) {
        this.runs.delete(id);
        this.actions.delete(id);
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
      agg = {
        organizationId,
        totalCalls: 0,
        totalCost: 0,
        totalGeneratedLines: 0,
        totalAccepted: 0,
        totalRejected: 0,
        totalAcceptedLines: 0,
        days: {},
        byAgent: {},
      };
      this.aggregates.set(organizationId, agg);
    }
    return agg;
  }

  private getOrCreateDayBucket(agg: OrgAggregate, date: string): DayBucket {
    if (!agg.days[date]) {
      agg.days[date] = {
        date,
        calls: 0,
        cost: 0,
        generatedLines: 0,
        activeUsers: new Set(),
        byAgent: {},
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
  return { calls: 0, cost: 0, generatedLines: 0, accepted: 0, rejected: 0, acceptedLines: 0 };
}

function incrementAgentStats(map: Record<string, AgentStats>, run: AgentRun): void {
  if (!map[run.agentId]) map[run.agentId] = emptyAgentStats();
  const s = map[run.agentId];
  s.calls++;
  s.cost += run.cost;
  if (run.generatedLines !== undefined) s.generatedLines += run.generatedLines;
}

function applyActionToAgentStats(
  map: Record<string, AgentStats>,
  agentId: string,
  action: UserAction,
  lines: number,
): void {
  if (!map[agentId]) map[agentId] = emptyAgentStats();
  const s = map[agentId];
  if (action.accepted) {
    s.accepted++;
    s.acceptedLines += lines;
  } else {
    s.rejected++;
  }
}

function sumDaysToWindowStats(days: DayBucket[]): WindowStats {
  const byAgent: Record<string, AgentStats> = {};
  let totalCalls = 0;
  let totalCost = 0;
  let totalGeneratedLines = 0;
  let totalAccepted = 0;
  let totalRejected = 0;
  let totalAcceptedLines = 0;

  for (const bucket of days) {
    totalCalls += bucket.calls;
    totalCost += bucket.cost;
    totalGeneratedLines += bucket.generatedLines;

    for (const [agentId, s] of Object.entries(bucket.byAgent)) {
      if (!byAgent[agentId]) byAgent[agentId] = emptyAgentStats();
      const t = byAgent[agentId];
      t.calls += s.calls;
      t.cost += s.cost;
      t.generatedLines += s.generatedLines;
      t.accepted += s.accepted;
      t.rejected += s.rejected;
      t.acceptedLines += s.acceptedLines;
      totalAccepted += s.accepted;
      totalRejected += s.rejected;
      totalAcceptedLines += s.acceptedLines;
    }
  }

  return { totalCalls, totalCost, totalGeneratedLines, totalAccepted, totalRejected, totalAcceptedLines, byAgent };
}
