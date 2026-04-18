import { memo } from 'react';
import type { Agent } from '@repo/types';
import type { Globals, GlobalsActions } from '../types';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Slider } from '@/components/ui/Slider';

const DAY_PRESETS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const CALLS_ABS_MIN = 0;
const CALLS_ABS_MAX = 20;

interface GlobalDefaultsPanelProps {
  globals: Globals;
  allAgentsSelected: boolean;
  actions: GlobalsActions;
  agents: Agent[];
  running: boolean;
}

function GlobalDefaultsPanelBase({
  globals,
  allAgentsSelected,
  actions,
  agents,
  running,
}: GlobalDefaultsPanelProps) {
  const { days, callsMin, callsMax, validation, acceptance, agentIds } = globals;

  return (
    <div className="simulate-config">
      <section className="config-section">
        <h2 className="config-label">Date range</h2>
        <div className="day-presets">
          {DAY_PRESETS.map((p) => (
            <button
              key={p.value}
              className={`day-preset-btn${days === p.value ? ' active' : ''}`}
              onClick={() => actions.setDays(p.value)}
              disabled={running}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section className="config-section">
        <h2 className="config-label">
          Default calls / day
          <span className="config-value">
            {callsMin === callsMax ? callsMin : `${callsMin}–${callsMax}`}
          </span>
        </h2>
        <RangeSlider
          min={CALLS_ABS_MIN}
          max={CALLS_ABS_MAX}
          step={1}
          valueMin={callsMin}
          valueMax={callsMax}
          disabled={running}
          onChange={actions.setCallsRange}
        />
        <div className="slider-labels"><span>{CALLS_ABS_MIN}</span><span>{CALLS_ABS_MAX}</span></div>
        <p className="config-hint">
          Each engineer's daily calls are sampled uniformly within this range. Set min = max for a deterministic rate.
        </p>
      </section>

      <section className="config-section">
        <h2 className="config-label">
          Default validation rate
          <span className="config-value">{validation}%</span>
        </h2>
        <Slider
          min={0} max={100} step={5}
          value={validation}
          disabled={running}
          onChange={actions.setValidation}
        />
        <div className="slider-labels"><span>0%</span><span>100%</span></div>
        <p className="config-hint">
          Share of runs the engineer bothers to validate. The rest stay unvalidated.
        </p>
      </section>

      <section className="config-section">
        <h2 className="config-label">
          Default acceptance
          <span className="config-value">{acceptance}%</span>
        </h2>
        <Slider
          min={0} max={100} step={5}
          value={acceptance}
          disabled={running}
          onChange={actions.setAcceptance}
        />
        <div className="slider-labels"><span>0%</span><span>100%</span></div>
        <p className="config-hint">
          Of the validated runs, share accepted vs rejected.
        </p>
      </section>

      <section className="config-section">
        <div className="config-label-row">
          <h2 className="config-label">Default agents</h2>
          <button className="toggle-all-btn" onClick={actions.toggleAllAgents} disabled={running}>
            {allAgentsSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="agent-list">
          {agents.map((agent) => (
            <label key={agent.id} className={`agent-item${running ? ' locked' : ''}`}>
              <input
                type="checkbox"
                checked={agentIds.includes(agent.id)}
                disabled={running}
                onChange={() => actions.toggleAgent(agent.id)}
              />
              <span className="agent-name">{agent.name}</span>
              <span className="agent-price">
                ${(agent.inputTokenPrice * 1_000_000).toFixed(0)} / ${(agent.outputTokenPrice * 1_000_000).toFixed(0)} per 1M
              </span>
            </label>
          ))}
        </div>
        <p className="config-hint">
          These are defaults. Each engineer can override their own agent mix below.
        </p>
      </section>

      <section className="config-section">
        <button className="reset-defaults-btn" onClick={actions.reset} disabled={running}>
          ↺ Reset all defaults
        </button>
      </section>
    </div>
  );
}

export const GlobalDefaultsPanel = memo(GlobalDefaultsPanelBase);
