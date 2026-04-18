import { useParams, Navigate } from 'react-router-dom';
import { SimulatePage } from '@/features/simulate/components/SimulatePage';

export function SimulateRoute() {
  const { orgId } = useParams<{ orgId: string }>();
  if (!orgId) return <Navigate to="/" replace />;
  return <SimulatePage orgId={orgId} />;
}
