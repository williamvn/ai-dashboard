import { DAY_PRESETS, type DayPreset } from '../lib/dateRange';

interface DashboardHeaderProps {
  orgName: string;
  preset: DayPreset;
  onPresetChange: (preset: DayPreset) => void;
  refreshing: boolean;
}

export function DashboardHeader({ orgName, preset, onPresetChange, refreshing }: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      <div className="dashboard-header-main">
        <h1 className="dashboard-title">Analytics</h1>
        <p className="dashboard-subtitle">
          <strong>{orgName}</strong>
          {refreshing && <span className="dashboard-refreshing">· updating…</span>}
        </p>
      </div>
      <div className="dashboard-date-presets">
        {DAY_PRESETS.map((p) => (
          <button
            key={p.value}
            className={`dashboard-preset-btn${preset === p.value ? ' active' : ''}`}
            onClick={() => onPresetChange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
