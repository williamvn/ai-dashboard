import { api } from '@/services/api';
import type { RunAgentResponse, TaskLevel, User } from '@repo/types';
import type { EngineerOverride, EngineerSimConfig, Globals } from '../types';

/**
 * Merge per-engineer overrides onto global defaults to produce the configs the simulator runs.
 * Pure — belongs in the service, not inside a component, so it stays unit-testable.
 */
export function buildEngineerConfigs(
  selectedUsers: User[],
  overrides: Map<string, EngineerOverride>,
  globals: Globals,
): EngineerSimConfig[] {
  return selectedUsers.map((u) => {
    const ov = overrides.get(u.id);
    return {
      userId: u.id,
      callsPerDayMin: ov?.callsPerDayMin ?? globals.callsMin,
      callsPerDayMax: ov?.callsPerDayMax ?? globals.callsMax,
      validationRate: (ov?.validationRate ?? globals.validation) / 100,
      acceptanceRate: (ov?.acceptanceRate ?? globals.acceptance) / 100,
      agentIds: ov?.agentIds ?? globals.agentIds,
    };
  });
}

export interface SimulationConfig {
  engineers: EngineerSimConfig[];
  days: number;
}

export interface SimulationResult {
  totalPlanned: number;
  totalCalls: number;
  totalErrors: number;
  totalTokens: number;
  totalCost: number;
  totalValidated: number;
  totalAccepted: number;
  totalRejected: number;
  totalUnvalidated: number;
}

const TASK_LEVELS: readonly TaskLevel[] = ['easy', 'easy', 'easy', 'medium', 'medium', 'hard'] as const;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function sampleInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface SimEvent {
  userId: string;
  agentId: string;
  taskLevel: TaskLevel;
  timestamp: number;
  validationRate: number;
  acceptanceRate: number;
}

function buildEvents(engineers: EngineerSimConfig[], days: number): SimEvent[] {
  const now = Date.now();
  const msPerDay = 86_400_000;

  const events: SimEvent[] = [];

  for (let d = days - 1; d >= 0; d--) {
    const dayTs = now - d * msPerDay;
    for (const eng of engineers) {
      if (eng.agentIds.length === 0) continue;
      // Uniform sample within the engineer's configured range — min = max yields a deterministic rate
      const calls = sampleInt(eng.callsPerDayMin, eng.callsPerDayMax);
      for (let c = 0; c < calls; c++) {
        events.push({
          userId: eng.userId,
          agentId: pickRandom(eng.agentIds),
          taskLevel: pickRandom(Array.from(TASK_LEVELS)),
          timestamp: dayTs + Math.floor(Math.random() * msPerDay),
          validationRate: eng.validationRate,
          acceptanceRate: eng.acceptanceRate,
        });
      }
    }
  }

  return events;
}

export async function runSimulation(
  config: SimulationConfig,
  onProgress: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<SimulationResult> {
  const events = buildEvents(config.engineers, config.days);
  const totalPlanned = events.length;

  let done = 0;
  let totalErrors = 0;
  let totalTokens = 0;
  let totalCost = 0;
  let totalValidated = 0;
  let totalAccepted = 0;
  let totalRejected = 0;
  let totalUnvalidated = 0;

  const BATCH = 20;

  for (let i = 0; i < events.length; i += BATCH) {
    if (signal?.aborted) break;

    const batch = events.slice(i, i + BATCH);

    const results = await Promise.allSettled(
      batch.map(async (ev) => {
        if (signal?.aborted) return;

        const res = await api.post<RunAgentResponse>('/run-agent', {
          userId: ev.userId,
          agentId: ev.agentId,
          taskLevel: ev.taskLevel,
          timestamp: ev.timestamp,
        });

        totalTokens += res.totalTokens;
        totalCost += res.cost;

        // First gate: does this engineer bother to validate?
        const validates = Math.random() < ev.validationRate;
        if (!validates) {
          totalUnvalidated++;
          done++;
          onProgress(done, totalPlanned);
          return;
        }

        // Second gate: of validated runs, what fraction are accepted?
        const accepted = Math.random() < ev.acceptanceRate;
        totalValidated++;
        if (accepted) totalAccepted++;
        else totalRejected++;

        const validatedLines =
          accepted && res.generatedLines
            ? sampleInt(1, res.generatedLines)
            : undefined;

        await api.post('/validate-output', {
          runId: res.runId,
          accepted,
          validatedLines,
        });

        done++;
        onProgress(done, totalPlanned);
      }),
    );

    for (const r of results) {
      if (r.status === 'rejected') totalErrors++;
    }
  }

  return {
    totalPlanned,
    totalCalls: done,
    totalErrors,
    totalTokens,
    totalCost,
    totalValidated,
    totalAccepted,
    totalRejected,
    totalUnvalidated,
  };
}
