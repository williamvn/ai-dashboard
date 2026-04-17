import { useState } from 'react'
import { useOrganizations } from '../hooks/useOrganizations'
import { OrgCard } from './OrgCard'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

export function LandingPage() {
  const [search, setSearch] = useState('')
  const { data: orgs, isLoading, isError } = useOrganizations()

  const filtered =
    orgs?.filter((org) =>
      org.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? []

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="brand">
          <svg
            className="brand-icon"
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
          <span className="brand-name">AI Analytics</span>
          <span className="brand-badge">Beta</span>
        </div>
      </header>

      <main className="landing-main">
        <div className="landing-hero">
          <h1 className="landing-title">Select Organization</h1>
          <p className="landing-subtitle">
            Choose an organization to explore AI agent usage, cost, and
            productivity insights.
          </p>
        </div>

        <div className="landing-search">
          <Input
            type="search"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {isLoading && <Spinner />}

        {isError && (
          <p className="error-text">
            Failed to load organizations. Make sure the API is running.
          </p>
        )}

        {!isLoading && !isError && (
          <>
            {filtered.length > 0 ? (
              <div className="org-grid">
                {filtered.map((org) => (
                  <OrgCard key={org.id} org={org} />
                ))}
              </div>
            ) : (
              <p className="empty-text">No organizations match your search.</p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
