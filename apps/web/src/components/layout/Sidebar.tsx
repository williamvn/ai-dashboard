import { NavLink, useParams } from 'react-router-dom'
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: (orgId: string) => `/dashboard/${orgId}`,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="7" height="7" rx="1.5" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Simulate',
    to: (orgId: string) => `/simulate/${orgId}`,
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="10" cy="10" r="8" />
        <polygon points="8,7 14,10 8,13" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const { orgId } = useParams<{ orgId: string }>()
  const { data: orgs } = useOrganizations()

  const currentOrg = orgs?.find((o) => o.id === orgId)

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <svg
          className="sidebar-brand-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        <span className="sidebar-brand-name">AI Analytics</span>
      </div>

      {/* Org context */}
      {currentOrg && (
        <div className="sidebar-org">
          <div className="sidebar-org-avatar">
            {currentOrg.profilePicUrl ? (
              <img src={currentOrg.profilePicUrl} alt={currentOrg.name} />
            ) : (
              <span>{currentOrg.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="sidebar-org-name">{currentOrg.name}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to(orgId ?? '')}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <NavLink to="/" className="sidebar-back-link">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3L5 8l5 5" />
          </svg>
          All organizations
        </NavLink>
      </div>
    </aside>
  )
}
