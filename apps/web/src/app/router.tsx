import { createBrowserRouter } from 'react-router-dom'
import { LandingRoute } from '@/routes/landing'
import { DashboardRoute } from '@/routes/dashboard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingRoute />,
  },
  {
    path: '/dashboard/:orgId',
    element: <DashboardRoute />,
  },
])
