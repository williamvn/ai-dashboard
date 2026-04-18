import { memo } from 'react';
import type { User, Agent } from '@repo/types';
import type { EngineerOverride } from '../types';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Slider } from '@/components/ui/Slider';

const CALLS_ABS_MIN = 0;
const CALLS_ABS_MAX = 20;

interface EngineerRowProps {
  user: User;
  selected: boolean;
  expanded: boolean;
  override: EngineerOverride | undefined;
  globalCallsMin: number;
  globalCallsMax: number;
  globalValidationRate: number;
  globalAcceptanceRate: number;
  globalAgentIds: string[];
  agents: Agent[];
  disabled?: boolean;
  onToggleSelect: (userId: string) => void;
  onToggleExpand: (userId: string) => void;
  onOverrideChange: (userId: string, next: EngineerOverride) => void;
  onResetOverride: (userId: string) => void;
}

function formatCallsRange(lo: number, hi: number): string {
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
}

function EngineerRowBase({
  user,
  selected,
  expanded,
  override,
  globalCallsMin,
  globalCallsMax,
  globalValidationRate,
  globalAcceptanceRate,
  globalAgentIds,
  agents,
  disabled = false,
  onToggleSelect,
  onToggleExpand,
  onOverrideChange,
  onResetOverride,
}: EngineerRowProps) {
  const isCustomised = override !== undefined;
  const effectiveCallsMin = override?.callsPerDayMin ?? globalCallsMin;
  const effectiveCallsMax = override?.callsPerDayMax ?? globalCallsMax;
  const effectiveValidation = override?.validationRate ?? globalValidationRate;
  const effectiveAcceptance = override?.acceptanceRate ?? globalAcceptanceRate;
  const effectiveAgentIds = new Set(override?.agentIds ?? globalAgentIds);
  const hasNoAgents = effectiveAgentIds.size === 0;

  function setCallsRange(lo: number, hi: number) {
    onOverrideChange(user.id, { ...override, callsPerDayMin: lo, callsPerDayMax: hi });
  }

  function setValidationRate(v: number) {
    onOverrideChange(user.id, { ...override, validationRate: v });
  }

  function setAcceptanceRate(v: number) {
    onOverrideChange(user.id, { ...override, acceptanceRate: v });
  }

  function toggleAgent(agentId: string) {
    const next = new Set(effectiveAgentIds);
    if (next.has(agentId)) next.delete(agentId);
    else next.add(agentId);
    onOverrideChange(user.id, { ...override, agentIds: Array.from(next) });
  }

  return (
    <div
      className={`engineer-row${selected ? ' selected' : ''}${expanded ? ' expanded' : ''}${disabled ? ' locked' : ''}`}
    >
      <div
        className="engineer-row-main"
        onClick={disabled ? undefined : () => onToggleExpand(user.id)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) onToggleExpand(user.id); }}
        aria-expanded={expanded}
      >
        <button
          className="engineer-checkbox"
          onClick={(e) => { e.stopPropagation(); if (!disabled) onToggleSelect(user.id); }}
          aria-label={selected ? 'Deselect engineer' : 'Select engineer'}
          aria-pressed={selected}
          disabled={disabled}
        >
          <span className={`engineer-checkbox-box${selected ? ' checked' : ''}`}>
            {selected && (
              <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 5l2.5 2.5 4.5-4" />
              </svg>
            )}
          </span>
        </button>

        <img className="engineer-avatar" src={user.profilePicUrl} alt={user.name} />

        <span className="engineer-name">{user.name}</span>

        <span className="engineer-stat" title="Calls per day (range)">
          {formatCallsRange(effectiveCallsMin, effectiveCallsMax)}<span className="engineer-stat-unit">/day</span>
        </span>
        <span className="engineer-stat" title="Validation rate — % of runs this engineer validates">
          v {effectiveValidation}<span className="engineer-stat-unit">%</span>
        </span>
        <span className="engineer-stat" title="Acceptance rate — of validated runs, % accepted">
          a {effectiveAcceptance}<span className="engineer-stat-unit">%</span>
        </span>

        {hasNoAgents && (
          <span className="engineer-warn-badge" title="No agents selected — this engineer will not contribute calls">
            ⚠ no agents
          </span>
        )}

        {isCustomised && (
          <span className="engineer-custom-badge">custom</span>
        )}

        <span
          className={`engineer-expand-btn${expanded ? ' open' : ''}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </div>

      {expanded && !disabled && (
        <div className="engineer-row-detail">
          <div className="engineer-override-row">
            <span className="engineer-override-label">Calls / day</span>
            <RangeSlider
              min={CALLS_ABS_MIN}
              max={CALLS_ABS_MAX}
              step={1}
              valueMin={effectiveCallsMin}
              valueMax={effectiveCallsMax}
              onChange={setCallsRange}
              className="engineer-slider"
            />
            <span className="engineer-override-val">
              {formatCallsRange(effectiveCallsMin, effectiveCallsMax)}
            </span>
          </div>

          <div className="engineer-override-row">
            <span className="engineer-override-label">Validation</span>
            <Slider
              min={0}
              max={100}
              step={5}
              value={effectiveValidation}
              onChange={setValidationRate}
              className="engineer-slider"
            />
            <span className="engineer-override-val">{effectiveValidation}%</span>
          </div>

          <div className="engineer-override-row">
            <span className="engineer-override-label">Acceptance</span>
            <Slider
              min={0}
              max={100}
              step={5}
              value={effectiveAcceptance}
              onChange={setAcceptanceRate}
              className="engineer-slider"
            />
            <span className="engineer-override-val">{effectiveAcceptance}%</span>
          </div>

          <div className="engineer-override-agents">
            <span className="engineer-override-label">Agents</span>
            <div className="engineer-agent-chips">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  className={`agent-chip${effectiveAgentIds.has(agent.id) ? ' on' : ''}`}
                  onClick={() => toggleAgent(agent.id)}
                >
                  {agent.name}
                </button>
              ))}
            </div>
          </div>

          {isCustomised && (
            <button className="engineer-reset-btn" onClick={() => onResetOverride(user.id)}>
              Reset to defaults
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export const EngineerRow = memo(EngineerRowBase);
