import { useOutletContext } from 'react-router-dom';
import type { DashboardOutletContext } from '../DashboardPage';

export function UsageSection() {
  const { metrics } = useOutletContext<DashboardOutletContext>();

  return (
    <div className="dashboard-section">
      <p className="dashboard-placeholder">
        Usage section — <strong>{metrics.usage.totalCalls.toLocaleString()}</strong> total calls in window.
        Deep dive coming next.
      </p>
    </div>
  );
}
