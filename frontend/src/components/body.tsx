import { createComponent, Shade, Router } from '@furystack/shades'
import { SessionService } from '../services/session.js'
import { Init, Offline, Login } from '../pages/index.js'
import { fileBrowserRoutes } from './routes/file-browser-routes.js'
import { entityRoutes } from './routes/entity-routes.js'
import { movieRoutes } from './routes/movie-routes.js'
import { dashboardRoutes } from './routes/dashboard-routes.js'
import { ThemeProviderService } from '@furystack/shades-common-components'

export const Body = Shade<{ style?: Partial<CSSStyleDeclaration> }>({
  shadowDomName: 'shade-app-body',
  render: ({ useObservable, injector }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)
    const [currentUser] = useObservable('currentUser', session.currentUser)
    const { theme } = injector.getInstance(ThemeProviderService)

    const hasAdminRole = currentUser?.roles?.includes('admin') ?? false

    return (
      <div
        id="Body"
        style={{
          color: theme.text.secondary,
        }}>
        {(() => {
          switch (sessionState) {
            case 'authenticated':
              return (
                <Router
                  routes={[
                    ...movieRoutes,
                    ...(hasAdminRole ? [...entityRoutes, ...fileBrowserRoutes] : []),
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
        })()}
      </div>
    )
  },
})
