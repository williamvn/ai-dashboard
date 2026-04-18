import type { Agent } from '@repo/types';

/**
 * Prices chosen so cost math stays trivially verifiable in tests:
 *   cost = inputTokens × 0.01 + outputTokens × 0.02
 * Every token range spans a single value, making sampled outputs deterministic.
 */
export const AGENT_GEN: Agent = {
  id: 'agent-gen',
  name: 'Line Generator',
  generatesLines: true,
  inputTokenPrice: 0.01,
  outputTokenPrice: 0.02,
  tokenProfile: {
    easy: { inputMin: 100, inputMax: 100, outputMin: 50, outputMax: 50 },
    medium: { inputMin: 200, inputMax: 200, outputMin: 150, outputMax: 150 },
    hard: { inputMin: 400, inputMax: 400, outputMin: 300, outputMax: 300 },
  },
  latency: { easy: 500, medium: 1500, hard: 3500 },
};

export const AGENT_REVIEW: Agent = {
  id: 'agent-review',
  name: 'Reviewer',
  generatesLines: false,
  inputTokenPrice: 0.03,
  outputTokenPrice: 0.04,
  tokenProfile: {
    easy: { inputMin: 1000, inputMax: 1000, outputMin: 100, outputMax: 100 },
    medium: { inputMin: 2000, inputMax: 2000, outputMin: 200, outputMax: 200 },
    hard: { inputMin: 4000, inputMax: 4000, outputMin: 400, outputMax: 400 },
  },
  latency: { easy: 400, medium: 1200, hard: 3000 },
};

export const TEST_AGENTS: Agent[] = [AGENT_GEN, AGENT_REVIEW];
