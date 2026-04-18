import { Navigate, useParams } from 'react-router-dom';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';

export function DashboardRoute() {
  const { orgId } = useParams<{ orgId: string }>();
  if (!orgId) return <Navigate to="/" replace />;
  return <DashboardPage orgId={orgId} />;
}
