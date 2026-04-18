import { Spinner } from '@/components/ui/Spinner';

interface SectionStateProps {
  isPending: boolean;
  error: unknown;
}

/**
 * Shared loading + error shell for dashboard sections. Centralized so every
 * section behaves the same while each one fetches its own slice of data.
 */
export function SectionState({ isPending, error }: SectionStateProps) {
  if (isPending) {
    return (
      <div className="dashboard-section dashboard-loading">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-section">
        <p className="error-text">Could not load metrics. Is the API running?</p>
      </div>
    );
  }

  return null;
}
