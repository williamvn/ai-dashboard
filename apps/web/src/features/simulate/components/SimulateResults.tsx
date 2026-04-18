import type { SimulationResult } from '../services/simulate.service';

interface SimulateResultsProps {
  result: SimulationResult | null;
}

export function SimulateResults({ result }: SimulateResultsProps) {
  if (!result) return null;

  const acceptanceRate = result.totalValidated > 0
    ? Math.round((result.totalAccepted / result.totalValidated) * 100)
    : 0;

  return (
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
          <span className="sim-result-value">{acceptanceRate}%</span>
        </div>
      </div>
      {result.totalErrors > 0 && (
        <p className="sim-results-errors">
          ⚠ {result.totalErrors} call{result.totalErrors > 1 ? 's' : ''} failed due to API errors and were skipped.
        </p>
      )}
      <p className="sim-results-hint">Data is now available in the Dashboard.</p>
    </div>
  );
}
