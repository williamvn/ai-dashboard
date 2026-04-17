import { useNavigate } from 'react-router-dom'
import type { Organization } from '@repo/types'

interface OrgCardProps {
  org: Organization
}

export function OrgCard({ org }: OrgCardProps) {
  const navigate = useNavigate()

  return (
    <button
      className="org-card"
      onClick={() => void navigate(`/dashboard/${org.id}`)}
    >
      <div className="org-card-avatar">
        {org.profilePicUrl ? (
          <img src={org.profilePicUrl} alt={org.name} />
        ) : (
          <div className="org-card-avatar-fallback">
            {org.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="org-card-body">
        <span className="org-card-name">{org.name}</span>
        <span className="org-card-action">View Analytics →</span>
      </div>
    </button>
  )
}
