import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearOrgData } from '@/features/organizations/services/organizations.service';

interface ClearDataButtonProps {
  orgId: string;
  disabled?: boolean;
  onCleared?: () => void;
}

export function ClearDataButton({ orgId, disabled, onCleared }: ClearDataButtonProps) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setClearing(true);
    setError(null);
    try {
      await clearOrgData(orgId);
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setConfirming(false);
      onCleared?.();
    } catch (e) {
      setError('Failed to clear data. Make sure the API is running.');
      console.error(e);
    } finally {
      setClearing(false);
    }
  }

  return (
    <>
      <button
        className="clear-data-btn"
        onClick={() => setConfirming(true)}
        disabled={disabled}
        title="Remove all simulated runs for this organization"
      >
        Clear Data
      </button>

      {confirming && (
        <div className="sim-blocker-overlay">
          <div className="sim-blocker-dialog">
            <h3 className="sim-blocker-title">Clear analytic data?</h3>
            <p className="sim-blocker-body">
              This permanently removes all simulated runs and validations for this
              organization. Dashboard metrics will reset to zero. This cannot be undone.
            </p>
            {error && <p className="sim-blocker-error">{error}</p>}
            <div className="sim-blocker-actions">
              <button
                className="sim-blocker-btn-cancel"
                onClick={() => setConfirming(false)}
                disabled={clearing}
              >
                Cancel
              </button>
              <button
                className="sim-blocker-btn-confirm"
                onClick={() => void handleConfirm()}
                disabled={clearing}
              >
                {clearing ? 'Clearing…' : 'Clear data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
