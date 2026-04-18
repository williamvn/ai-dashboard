import { NavLink } from 'react-router-dom';

const TABS = [
  { label: 'Usage', path: 'usage' },
  { label: 'Cost', path: 'cost' },
  { label: 'Impact', path: 'impact' },
];

interface DashboardTabsProps {
  orgId: string;
}

export function DashboardTabs({ orgId }: DashboardTabsProps) {
  return (
    <nav className="dashboard-tabs" aria-label="Dashboard sections">
      {TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={`/dashboard/${orgId}/${tab.path}`}
          className={({ isActive }) => `dashboard-tab${isActive ? ' active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
