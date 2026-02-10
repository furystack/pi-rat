import { createComponent } from '@furystack/shades'
import { LoadableDashboard } from '../dashboard/LoadableDashboard.js'
import { DefaultDashboard } from '../dashboard/default-dashboard.js'
import type { MatchResult } from 'path-to-regexp'

export const loadableDashboardRoute = {
  url: '/dashboards/:id',
  component: ({ match }: { match: MatchResult<{ id: string }> }) => {
    return <LoadableDashboard id={match.params.id} />
  },
}

export const defaultDashboardRoute = {
  url: '/',
  routingOptions: { end: false },
  component: () => <DefaultDashboard />,
}

export const dashboardRoutes = {
  [loadableDashboardRoute.url]: loadableDashboardRoute,
  [defaultDashboardRoute.url]: defaultDashboardRoute,
}
