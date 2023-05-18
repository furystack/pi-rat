import { createComponent } from '@furystack/shades'
import { onLeave, onVisit } from './route-animations.js'
import { LoadableDashboard } from '../dashboard/LoadableDashboard.js'
import { DefaultDashboard } from '../dashboard/default-dashboard.js'
import type { MatchResult } from 'path-to-regexp'

export const loadableDashboardRoute = {
  url: '/dashboards/:id',
  onVisit,
  onLeave,
  component: ({ match }: { match: MatchResult<{ id: string }> }) => {
    return <LoadableDashboard id={match.params.id} />
  },
}

export const defaultDashboardRoute = {
  url: '/',
  routingOptions: { end: false },
  onVisit,
  onLeave,
  component: () => <DefaultDashboard />,
}

export const dashboardRoutes = [loadableDashboardRoute, defaultDashboardRoute] as const
