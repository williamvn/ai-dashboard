import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export function NotFoundPage() {
  return (
    <div className="not-found-page">
      <span className="not-found-code">404</span>
      <h1 className="not-found-title">Page not found</h1>
      <p className="not-found-body">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="not-found-link">
        ← Back to organizations
      </Link>
    </div>
  );
}
