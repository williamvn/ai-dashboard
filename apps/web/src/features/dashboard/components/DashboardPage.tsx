import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations';
import { dateRangeFromPreset, type DateRange, type DayPreset } from '../lib/dateRange';
import { DashboardHeader } from './DashboardHeader';
import { DashboardTabs } from './DashboardTabs';
import '../dashboard.css';

export interface DashboardOutletContext {
  organizationId: string;
  dateRange: DateRange;
}

interface DashboardPageProps {
  orgId: string;
}

export function DashboardPage({ orgId }: DashboardPageProps) {
  const { data: orgs } = useOrganizations();
  const org = orgs?.find((o) => o.id === orgId);

  const [dateRange, setDateRange] = useState<DateRange>(() => dateRangeFromPreset('30d'));

  // Truthy while any analytics query is fetching or refetching — covers every
  // section without the header needing to know how many hooks are in flight.
  const refreshing = useIsFetching({ queryKey: ['analytics'] }) > 0;

  function handlePresetChange(preset: DayPreset) {
    setDateRange(dateRangeFromPreset(preset));
  }

  return (
    <div className="dashboard-page">
      <DashboardHeader
        orgName={org?.name ?? '…'}
        preset={dateRange.preset}
        onPresetChange={handlePresetChange}
        refreshing={refreshing}
      />

      <DashboardTabs orgId={orgId} />

      <div className="dashboard-content">
        <Outlet
          context={{ organizationId: orgId, dateRange } satisfies DashboardOutletContext}
        />
      </div>
    </div>
  );
}
