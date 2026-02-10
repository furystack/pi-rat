import { createComponent, NestedRouter, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'
import {
  adminRoutes,
  aiRoutes,
  authRoutes,
  chatRoutes,
  dashboardRoutes,
  entityRoutes,
  fileBrowserRoutes,
  iotRoutes,
  loggingRoutes,
  movieRoutes,
  userRoutes,
} from '../app-routes.js'
import { Init, Offline } from '../pages/index.js'
import { SessionService } from '../services/session.js'

export const Body = Shade({
  shadowDomName: 'shade-app-body',
  css: {
    color: cssVariableTheme.text.secondary,
  },
  render: ({ useObservable, injector }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    const hasAdminRole = currentUser?.roles?.includes('admin') ?? false

    switch (sessionState) {
      case 'authenticated':
        return (
          <NestedRouter
            routes={{
              ...movieRoutes,
              ...(hasAdminRole
                ? { ...adminRoutes, ...entityRoutes, ...fileBrowserRoutes, ...iotRoutes, ...loggingRoutes }
                : {}),
              ...dashboardRoutes,
              ...chatRoutes,
              ...aiRoutes,
              ...userRoutes,
            }}
          />
        )
      case 'offline':
        return <Offline />
      case 'unauthenticated':
        return <NestedRouter routes={{ ...authRoutes }} />
      default:
        return <Init />
    }
  },
})
