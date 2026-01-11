import { createComponent, Router, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'
import { Init, Offline } from '../pages/index.js'
import { SessionService } from '../services/session.js'
import { adminRoutes } from './routes/admin-routes.js'
import { aiRoutes } from './routes/ai-routes.js'
import { authRoutes } from './routes/auth-routes.js'
import { chatRoutes } from './routes/chat-routes.js'
import { dashboardRoutes } from './routes/dashboard-routes.js'
import { entityRoutes } from './routes/entity-routes.js'
import { fileBrowserRoutes } from './routes/file-browser-routes.js'
import { iotRoutes } from './routes/iot-routes.js'
import { loggingRoutes } from './routes/logging-routes.js'
import { movieRoutes } from './routes/movie-routes.js'
import { userRoutes } from './routes/user-routes.js'

export const Body = Shade<{ style?: Partial<CSSStyleDeclaration> }>({
  shadowDomName: 'shade-app-body',
  style: {
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
          <Router
            routes={[
              ...movieRoutes,
              ...(hasAdminRole
                ? [...adminRoutes, ...entityRoutes, ...fileBrowserRoutes, ...iotRoutes, ...loggingRoutes]
                : []),
              ...dashboardRoutes,
              ...chatRoutes,
              ...aiRoutes,
              ...userRoutes,
            ]}
          />
        )
      case 'offline':
        return <Offline />
      case 'unauthenticated':
        return <Router routes={[...authRoutes]} />
      default:
        return <Init />
    }
  },
})
