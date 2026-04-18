import type { User } from '@repo/types';
import { describe, expect, it } from 'vitest';
import type { EngineerOverride, Globals } from '../types';
import { buildEngineerConfigs } from './simulate.service';

const GLOBALS: Globals = {
  days: 14,
  callsMin: 5,
  callsMax: 10,
  validation: 60, // whole-number percent
  acceptance: 80,
  agentIds: ['agent-refactor', 'agent-test-gen'],
};

const USERS: User[] = [
  { id: 'user-1', organizationId: 'org-1', name: 'Alice', profilePicUrl: '' },
  { id: 'user-2', organizationId: 'org-1', name: 'Bob', profilePicUrl: '' },
];

describe('buildEngineerConfigs', () => {
  it('falls back to globals for every engineer without an override', () => {
    const configs = buildEngineerConfigs(USERS, new Map(), GLOBALS);

    expect(configs).toHaveLength(2);
    expect(configs[0]).toEqual({
      userId: 'user-1',
      callsPerDayMin: 5,
      callsPerDayMax: 10,
      validationRate: 0.6,
      acceptanceRate: 0.8,
      agentIds: ['agent-refactor', 'agent-test-gen'],
    });
  });

  it('converts percentage-valued global rates (0–100) into 0–1 ratios the simulator expects', () => {
    const configs = buildEngineerConfigs(USERS, new Map(), GLOBALS);
    expect(configs[0].validationRate).toBeCloseTo(0.6, 10);
    expect(configs[0].acceptanceRate).toBeCloseTo(0.8, 10);
  });

  it('applies per-engineer overrides only to the targeted engineer', () => {
    const overrides = new Map<string, EngineerOverride>([
      [
        'user-1',
        {
          callsPerDayMin: 20,
          callsPerDayMax: 30,
          validationRate: 90,
          acceptanceRate: 50,
          agentIds: ['agent-api-gen'],
        },
      ],
    ]);

    const [first, second] = buildEngineerConfigs(USERS, overrides, GLOBALS);

    expect(first).toEqual({
      userId: 'user-1',
      callsPerDayMin: 20,
      callsPerDayMax: 30,
      validationRate: 0.9,
      acceptanceRate: 0.5,
      agentIds: ['agent-api-gen'],
    });
    // Second engineer still inherits globals.
    expect(second.callsPerDayMin).toBe(5);
    expect(second.validationRate).toBeCloseTo(0.6, 10);
    expect(second.agentIds).toEqual(GLOBALS.agentIds);
  });

  it('merges partial overrides — unspecified fields fall through to globals', () => {
    const overrides = new Map<string, EngineerOverride>([
      ['user-1', { callsPerDayMax: 99 }],
    ]);

    const [first] = buildEngineerConfigs(USERS, overrides, GLOBALS);

    expect(first.callsPerDayMin).toBe(5); // global
    expect(first.callsPerDayMax).toBe(99); // override
    expect(first.validationRate).toBeCloseTo(0.6, 10); // global
    expect(first.agentIds).toEqual(GLOBALS.agentIds); // global
  });

  it('preserves engineer order so downstream event planning stays deterministic', () => {
    const configs = buildEngineerConfigs(USERS, new Map(), GLOBALS);
    expect(configs.map((c) => c.userId)).toEqual(['user-1', 'user-2']);
  });

  it('returns an empty array when no engineers are selected', () => {
    expect(buildEngineerConfigs([], new Map(), GLOBALS)).toEqual([]);
  });
});
