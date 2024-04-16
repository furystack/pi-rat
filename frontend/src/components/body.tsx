import { createComponent, Shade, Router } from '@furystack/shades'
import { SessionService } from '../services/session.js'
import { Init, Offline, Login } from '../pages/index.js'
import { fileBrowserRoutes } from './routes/file-browser-routes.js'
import { entityRoutes } from './routes/entity-routes.js'
import { movieRoutes } from './routes/movie-routes.js'
import { dashboardRoutes } from './routes/dashboard-routes.js'
import { cssVariableTheme } from '@furystack/shades-common-components'
import { torrentRoutes } from './routes/torrent-routes.js'
import { iotRoutes } from './routes/iot-routes.js'

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
              ...(hasAdminRole ? [...entityRoutes, ...fileBrowserRoutes, ...iotRoutes] : []),
              ...torrentRoutes,
              ...dashboardRoutes,
            ]}
          />
        )
      case 'offline':
        return <Offline />
      case 'unauthenticated':
        return <Login />
      default:
        return <Init />
    }
  },
})
