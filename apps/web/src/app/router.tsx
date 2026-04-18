import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LandingRoute } from '@/routes/landing';
import { DashboardRoute } from '@/routes/dashboard';
import { SimulateRoute } from '@/routes/simulate';
import { NotFoundRoute } from '@/routes/not-found';
import { UsageSection } from '@/features/dashboard/components/sections/UsageSection';
import { CostSection } from '@/features/dashboard/components/sections/CostSection';
import { ImpactSection } from '@/features/dashboard/components/sections/ImpactSection';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingRoute />,
  },
  {
    element: <AppShell />,
    children: [
      {
        path: '/dashboard/:orgId',
        element: <DashboardRoute />,
        children: [
          { index: true, element: <Navigate to="usage" replace /> },
          { path: 'usage', element: <UsageSection /> },
          { path: 'cost', element: <CostSection /> },
          { path: 'impact', element: <ImpactSection /> },
        ],
      },
      {
        path: '/simulate/:orgId',
        element: <SimulateRoute />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundRoute />,
  },
]);
