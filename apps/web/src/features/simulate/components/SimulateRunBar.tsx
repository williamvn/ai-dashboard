interface SimulateRunBarProps {
  estimatedCalls: number;
  running: boolean;
  progress: { done: number; total: number };
  progressPct: number;
  canRun: boolean;
  onRun: () => void;
  onStop: () => void;
}

export function SimulateRunBar({
  estimatedCalls,
  running,
  progress,
  progressPct,
  canRun,
  onRun,
  onStop,
}: SimulateRunBarProps) {
  return (
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
          <button className="stop-btn" onClick={onStop}>
            ■ Stop
          </button>
        </div>
      ) : (
        <button className="run-btn" onClick={onRun} disabled={!canRun}>
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4 3l10 5-10 5V3z" />
          </svg>
          Run Simulation
        </button>
      )}
    </div>
  );
}
