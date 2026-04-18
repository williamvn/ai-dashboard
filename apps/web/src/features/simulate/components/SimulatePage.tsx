import { useState, useEffect, useRef, useMemo } from 'react';
import { useBlocker, Navigate } from 'react-router-dom';
import { useOrgUsers } from '../hooks/useOrgUsers';
import { useAgents } from '../hooks/useAgents';
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations';
import { runSimulation, type SimulationResult } from '../services/simulate.service';
import type { EngineerOverride } from '../types';
import { EngineerRow } from './EngineerRow';
import { Spinner } from '@/components/ui/Spinner';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Slider } from '@/components/ui/Slider';
import '../simulate.css';

const DAY_PRESETS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const DEFAULT_CALLS_MIN = 3;
const DEFAULT_CALLS_MAX = 8;
const DEFAULT_VALIDATION = 85;
const DEFAULT_ACCEPTANCE = 75;
const CALLS_ABS_MIN = 1;
const CALLS_ABS_MAX = 20;

interface SimulatePageProps {
  orgId: string;
}

export function SimulatePage({ orgId }: SimulatePageProps) {
  const { data: orgs } = useOrganizations();
  const { data: users = [], isLoading: loadingUsers, error: usersError } = useOrgUsers(orgId);
  const { data: agents = [], isLoading: loadingAgents } = useAgents();

  const org = orgs?.find((o) => o.id === orgId);

  // ── Global defaults ────────────────────────────────────────────────────────
  const [days, setDays] = useState(30);
  const [globalCallsMin, setGlobalCallsMin] = useState(DEFAULT_CALLS_MIN);
  const [globalCallsMax, setGlobalCallsMax] = useState(DEFAULT_CALLS_MAX);
  const [globalValidation, setGlobalValidation] = useState(DEFAULT_VALIDATION);
  const [globalAcceptance, setGlobalAcceptance] = useState(DEFAULT_ACCEPTANCE);
  const [globalAgentIds, setGlobalAgentIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // One-time initialization — use refs to prevent re-init on re-render
  const agentsInitialized = useRef(false);
  const usersInitialized = useRef(false);

  useEffect(() => {
    if (!agentsInitialized.current && agents.length > 0) {
      agentsInitialized.current = true;
      setGlobalAgentIds(agents.map((a) => a.id));
    }
  }, [agents]);

  useEffect(() => {
    if (!usersInitialized.current && users.length > 0) {
      usersInitialized.current = true;
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    }
  }, [users]);

  // ── Per-engineer overrides ─────────────────────────────────────────────────
  const [overrides, setOverrides] = useState<Map<string, EngineerOverride>>(new Map());
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  function setOverride(userId: string, next: EngineerOverride) {
    setOverrides((prev) => new Map(prev).set(userId, next));
  }

  function resetOverride(userId: string) {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }

  function resetAllDefaults() {
    setGlobalCallsMin(DEFAULT_CALLS_MIN);
    setGlobalCallsMax(DEFAULT_CALLS_MAX);
    setGlobalValidation(DEFAULT_VALIDATION);
    setGlobalAcceptance(DEFAULT_ACCEPTANCE);
    setGlobalAgentIds(agents.map((a) => a.id));
    setOverrides(new Map());
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleAllUsers() {
    if (allUsersSelected) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    }
  }

  function toggleGlobalAgent(agentId: string) {
    setGlobalAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId],
    );
  }

  function toggleAllAgents() {
    if (allAgentsSelected) {
      setGlobalAgentIds([]);
    } else {
      setGlobalAgentIds(agents.map((a) => a.id));
    }
  }

  // ── Derived / memoized values ──────────────────────────────────────────────
  const selectedUsers = useMemo(
    () => users.filter((u) => selectedUserIds.has(u.id)),
    [users, selectedUserIds],
  );

  const allUsersSelected = useMemo(
    () => users.length > 0 && users.every((u) => selectedUserIds.has(u.id)),
    [users, selectedUserIds],
  );

  const allAgentsSelected = useMemo(
    () => agents.length > 0 && agents.every((a) => globalAgentIds.includes(a.id)),
    [agents, globalAgentIds],
  );

  const estimatedCalls = useMemo(
    () =>
      selectedUsers.reduce((sum, u) => {
        const ov = overrides.get(u.id);
        const effectiveAgents = ov?.agentIds ?? globalAgentIds;
        if (effectiveAgents.length === 0) return sum;
        const lo = ov?.callsPerDayMin ?? globalCallsMin;
        const hi = ov?.callsPerDayMax ?? globalCallsMax;
        return sum + ((lo + hi) / 2) * days;
      }, 0),
    [selectedUsers, overrides, globalCallsMin, globalCallsMax, globalAgentIds, days],
  );

  const customisedCount = overrides.size;

  // ── Simulation state ────────────────────────────────────────────────────────
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort simulation when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Block navigation while simulation is running
  const blocker = useBlocker(running);

  const progressPct = useMemo(
    () => (progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0),
    [progress],
  );

  async function handleRun() {
    if (selectedUsers.length === 0 || globalAgentIds.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setRunning(true);
    setResult(null);
    setError(null);
    setProgress({ done: 0, total: 0 });

    const engineers = selectedUsers.map((u) => {
      const ov = overrides.get(u.id);
      return {
        userId: u.id,
        callsPerDayMin: ov?.callsPerDayMin ?? globalCallsMin,
        callsPerDayMax: ov?.callsPerDayMax ?? globalCallsMax,
        validationRate: (ov?.validationRate ?? globalValidation) / 100,
        acceptanceRate: (ov?.acceptanceRate ?? globalAcceptance) / 100,
        agentIds: ov?.agentIds ?? globalAgentIds,
      };
    });

    try {
      const res = await runSimulation(
        { engineers, days },
        (done, total) => setProgress({ done, total }),
        controller.signal,
      );
      setResult(res);
    } catch (e) {
      if (!controller.signal.aborted) {
        setError('Simulation failed. Make sure the API is running.');
        console.error(e);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  const isLoading = loadingUsers || loadingAgents;

  if (usersError?.message.includes('404')) return <Navigate to="/" replace />;

  return (
    <div className="simulate-page">
      {/* Navigation blocker modal */}
      {blocker.state === 'blocked' && (
        <div className="sim-blocker-overlay">
          <div className="sim-blocker-dialog">
            <h3 className="sim-blocker-title">Simulation in progress</h3>
            <p className="sim-blocker-body">
              Leaving this page will stop the simulation. Any progress so far will be saved,
              but the run will not complete.
            </p>
            <div className="sim-blocker-actions">
              <button
                className="sim-blocker-btn-cancel"
                onClick={() => blocker.reset()}
              >
                Stay on page
              </button>
              <button
                className="sim-blocker-btn-confirm"
                onClick={() => {
                  abortRef.current?.abort();
                  blocker.proceed();
                }}
              >
                Leave & stop simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="simulate-header">
        <div>
          <h1 className="simulate-title">Simulate Usage</h1>
          <p className="simulate-subtitle">
            Generate synthetic AI agent activity for{' '}
            <strong>{org?.name ?? '…'}</strong>
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="simulate-loading">
          <Spinner />
        </div>
      ) : (
        <div className={`simulate-body${running ? ' simulate-body--locked' : ''}`}>
          {/* ── Left: Global defaults ─────────────────────────────── */}
          <div className="simulate-config">
            <section className="config-section">
              <h2 className="config-label">Date range</h2>
              <div className="day-presets">
                {DAY_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    className={`day-preset-btn${days === p.value ? ' active' : ''}`}
                    onClick={() => setDays(p.value)}
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
                  {globalCallsMin === globalCallsMax
                    ? globalCallsMin
                    : `${globalCallsMin}–${globalCallsMax}`}
                </span>
              </h2>
              <RangeSlider
                min={CALLS_ABS_MIN}
                max={CALLS_ABS_MAX}
                step={1}
                valueMin={globalCallsMin}
                valueMax={globalCallsMax}
                disabled={running}
                onChange={(lo, hi) => { setGlobalCallsMin(lo); setGlobalCallsMax(hi); }}
              />
              <div className="slider-labels"><span>{CALLS_ABS_MIN}</span><span>{CALLS_ABS_MAX}</span></div>
              <p className="config-hint">
                Each engineer's daily calls are sampled uniformly within this range. Set min = max for a deterministic rate.
              </p>
            </section>

            <section className="config-section">
              <h2 className="config-label">
                Default validation rate
                <span className="config-value">{globalValidation}%</span>
              </h2>
              <Slider
                min={0} max={100} step={5}
                value={globalValidation}
                disabled={running}
                onChange={setGlobalValidation}
              />
              <div className="slider-labels"><span>0%</span><span>100%</span></div>
              <p className="config-hint">
                Share of runs the engineer bothers to validate. The rest stay unvalidated.
              </p>
            </section>

            <section className="config-section">
              <h2 className="config-label">
                Default acceptance
                <span className="config-value">{globalAcceptance}%</span>
              </h2>
              <Slider
                min={0} max={100} step={5}
                value={globalAcceptance}
                disabled={running}
                onChange={setGlobalAcceptance}
              />
              <div className="slider-labels"><span>0%</span><span>100%</span></div>
              <p className="config-hint">
                Of the validated runs, share accepted vs rejected.
              </p>
            </section>

            <section className="config-section">
              <div className="config-label-row">
                <h2 className="config-label">Default agents</h2>
                <button className="toggle-all-btn" onClick={toggleAllAgents} disabled={running}>
                  {allAgentsSelected ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="agent-list">
                {agents.map((agent) => (
                  <label key={agent.id} className={`agent-item${running ? ' locked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={globalAgentIds.includes(agent.id)}
                      disabled={running}
                      onChange={() => toggleGlobalAgent(agent.id)}
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
              <button className="reset-defaults-btn" onClick={resetAllDefaults} disabled={running}>
                ↺ Reset all defaults
              </button>
            </section>
          </div>

          {/* ── Right: Engineers ──────────────────────────────────── */}
          <div className="simulate-users">
            <div className="config-label-row" style={{ marginBottom: 8 }}>
              <h2 className="config-label">
                Engineers
                <span className="config-count">{selectedUsers.length}/{users.length}</span>
                {customisedCount > 0 && (
                  <span className="custom-count-badge">{customisedCount} custom</span>
                )}
              </h2>
              <button className="toggle-all-btn" onClick={toggleAllUsers} disabled={running}>
                {allUsersSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="user-list">
              {users.map((user) => (
                <EngineerRow
                  key={user.id}
                  user={user}
                  selected={selectedUserIds.has(user.id)}
                  expanded={expandedUserId === user.id}
                  override={overrides.get(user.id)}
                  globalCallsMin={globalCallsMin}
                  globalCallsMax={globalCallsMax}
                  globalValidationRate={globalValidation}
                  globalAcceptanceRate={globalAcceptance}
                  globalAgentIds={globalAgentIds}
                  agents={agents}
                  disabled={running}
                  onToggleSelect={() => toggleUser(user.id)}
                  onToggleExpand={() =>
                    setExpandedUserId((prev) => (prev === user.id ? null : user.id))
                  }
                  onOverrideChange={(ov) => setOverride(user.id, ov)}
                  onResetOverride={() => resetOverride(user.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Run bar ──────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="simulate-run-bar">
          <span className="estimated-calls">
            ~{Math.round(estimatedCalls).toLocaleString()} calls estimated
          </span>

          {running ? (
            <div className="sim-progress">
              <div className="sim-progress-bar">
                <div className="sim-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="sim-progress-label">
                {progress.done} / {progress.total}
              </span>
              <button className="stop-btn" onClick={handleStop}>
                ■ Stop
              </button>
            </div>
          ) : (
            <button
              className="run-btn"
              onClick={() => void handleRun()}
              disabled={selectedUsers.length === 0 || globalAgentIds.length === 0}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M4 3l10 5-10 5V3z" />
              </svg>
              Run Simulation
            </button>
          )}
        </div>
      )}

      {error && <p className="error-text" style={{ padding: '0 24px 16px' }}>{error}</p>}

      {/* ── Results ──────────────────────────────────────────────── */}
      {result && (
        <div className="sim-results">
          <h2 className="sim-results-title">Results</h2>
          <div className="sim-results-grid">
            <div className="sim-result-card">
              <span className="sim-result-label">Completed</span>
              <span className="sim-result-value">
                {result.totalCalls.toLocaleString()}
                <span className="sim-result-sub">/ {result.totalPlanned.toLocaleString()} planned</span>
              </span>
            </div>
            <div className="sim-result-card">
              <span className="sim-result-label">Total Tokens</span>
              <span className="sim-result-value">{result.totalTokens.toLocaleString()}</span>
            </div>
            <div className="sim-result-card">
              <span className="sim-result-label">Total Cost</span>
              <span className="sim-result-value">${result.totalCost.toFixed(2)}</span>
            </div>
            <div className="sim-result-card">
              <span className="sim-result-label">Validated</span>
              <span className="sim-result-value">
                {result.totalValidated.toLocaleString()}
                <span className="sim-result-sub">
                  / {result.totalUnvalidated.toLocaleString()} unvalidated
                </span>
              </span>
            </div>
            <div className="sim-result-card">
              <span className="sim-result-label">Accepted</span>
              <span className="sim-result-value success">{result.totalAccepted.toLocaleString()}</span>
            </div>
            <div className="sim-result-card">
              <span className="sim-result-label">Acceptance Rate</span>
              <span className="sim-result-value">
                {result.totalValidated > 0
                  ? Math.round((result.totalAccepted / result.totalValidated) * 100)
                  : 0}%
              </span>
            </div>
          </div>
          {result.totalErrors > 0 && (
            <p className="sim-results-errors">
              ⚠ {result.totalErrors} call{result.totalErrors > 1 ? 's' : ''} failed due to API errors and were skipped.
            </p>
          )}
          <p className="sim-results-hint">Data is now available in the Dashboard.</p>
        </div>
      )}
    </div>
  );
}
