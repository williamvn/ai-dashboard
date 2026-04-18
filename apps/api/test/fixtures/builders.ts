import type { AgentRun, ValidationEvent } from '@repo/types';

let runSeq = 0;

/** Reset the run id counter so a test gets stable, predictable run ids. */
export function resetRunSeq(): void {
  runSeq = 0;
}

/** Convert a YYYY-MM-DD (UTC midnight) to ms since epoch. */
export function dayMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export interface RunOverrides extends Partial<AgentRun> {
  /** Shorthand for timestamp: pass a 'YYYY-MM-DD' instead of epoch ms. */
  date?: string;
}

/**
 * Build a deterministic AgentRun. Defaults mirror AGENT_GEN easy-task output
 * (100 in, 50 out @ 0.01/0.02 → cost 2.0) so tests can assert exact values.
 * Override any field inline — use `date` for readable timestamps.
 */
export function makeRun(overrides: RunOverrides = {}): AgentRun {
  const { date, ...rest } = overrides;
  const inputTokens = rest.inputTokens ?? 100;
  const outputTokens = rest.outputTokens ?? 50;
  const inputCost = rest.inputCost ?? inputTokens * 0.01;
  const outputCost = rest.outputCost ?? outputTokens * 0.02;

  return {
    id: rest.id ?? `run-${++runSeq}`,
    organizationId: rest.organizationId ?? 'org-a',
    userId: rest.userId ?? 'user-a1',
    agentId: rest.agentId ?? 'agent-gen',
    taskLevel: rest.taskLevel ?? 'easy',
    inputTokens,
    outputTokens,
    totalTokens: rest.totalTokens ?? inputTokens + outputTokens,
    cost: rest.cost ?? inputCost + outputCost,
    inputCost,
    outputCost,
    latency: rest.latency ?? 500,
    generatedLines: rest.generatedLines,
    timestamp: rest.timestamp ?? (date ? dayMs(date) : dayMs('2026-01-01')),
  };
}

export function makeValidation(overrides: Partial<ValidationEvent> & { runId: string }): ValidationEvent {
  return {
    runId: overrides.runId,
    accepted: overrides.accepted ?? true,
    validatedLines: overrides.validatedLines,
  };
}
