import type { Blocker } from 'react-router-dom';

interface SimulateBlockerModalProps {
  blocker: Blocker;
  onAbort: () => void;
}

export function SimulateBlockerModal({ blocker, onAbort }: SimulateBlockerModalProps) {
  if (blocker.state !== 'blocked') return null;

  return (
    <div className="sim-blocker-overlay">
      <div className="sim-blocker-dialog">
        <h3 className="sim-blocker-title">Simulation in progress</h3>
        <p className="sim-blocker-body">
          Leaving this page will stop the simulation. Any progress so far will be saved,
          but the run will not complete.
        </p>
        <div className="sim-blocker-actions">
          <button className="sim-blocker-btn-cancel" onClick={() => blocker.reset()}>
            Stay on page
          </button>
          <button
            className="sim-blocker-btn-confirm"
            onClick={() => {
              onAbort();
              blocker.proceed?.();
            }}
          >
            Leave & stop simulation
          </button>
        </div>
      </div>
    </div>
  );
}
