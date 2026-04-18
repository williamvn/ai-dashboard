import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { DashboardMetrics } from '@repo/types';
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations';
import { Spinner } from '@/components/ui/Spinner';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { dateRangeFromPreset, type DateRange, type DayPreset } from '../lib/dateRange';
import { DashboardHeader } from './DashboardHeader';
import { DashboardTabs } from './DashboardTabs';
import '../dashboard.css';

export interface DashboardOutletContext {
  metrics: DashboardMetrics;
  dateRange: DateRange;
}

interface DashboardPageProps {
  orgId: string;
}

export function DashboardPage({ orgId }: DashboardPageProps) {
  const { data: orgs } = useOrganizations();
  const org = orgs?.find((o) => o.id === orgId);

  const [dateRange, setDateRange] = useState<DateRange>(() => dateRangeFromPreset('30d'));

  const {
    data: metrics,
    isPending,
    isFetching,
    error,
  } = useDashboardMetrics({ organizationId: orgId, from: dateRange.from, to: dateRange.to });

  function handlePresetChange(preset: DayPreset) {
    setDateRange(dateRangeFromPreset(preset));
  }

  return (
    <div className="dashboard-page">
      <DashboardHeader
        orgName={org?.name ?? '…'}
        preset={dateRange.preset}
        onPresetChange={handlePresetChange}
        refreshing={!isPending && isFetching}
      />

      <DashboardTabs orgId={orgId} />

      <div className="dashboard-content">
        {isPending ? (
          <div className="dashboard-loading">
            <Spinner />
          </div>
        ) : error ? (
          <p className="error-text">Could not load metrics. Is the API running?</p>
        ) : metrics ? (
          <Outlet context={{ metrics, dateRange } satisfies DashboardOutletContext} />
        ) : null}
      </div>
    </div>
  );
}
