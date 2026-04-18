import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LandingRoute } from '@/routes/landing';
import { DashboardRoute } from '@/routes/dashboard';
import { SimulateRoute } from '@/routes/simulate';
import { NotFoundRoute } from '@/routes/not-found';

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
