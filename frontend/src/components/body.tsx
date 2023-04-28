import type { Route } from '@furystack/shades'
import { createComponent, Shade, Router } from '@furystack/shades'
import { fadeOut, fadeIn } from '@furystack/shades-common-components'
import { SessionService } from '../services/session.js'
import { Init, Offline, Login } from '../pages/index.js'
import { DefaultDashboard } from './dashboard/default-dashboard.js'
import { LoadableDashboard } from './dashboard/LoadableDashboard.js'
import { PiRatLazyLoad } from './pirat-lazy-load.js'

const onLeave = async ({ element }: { element: HTMLElement }) => {
  await fadeOut(element, { easing: 'ease-in', duration: 200 })
}

const onVisit = async ({ element }: { element: HTMLElement }) => {
  await fadeIn(element, { easing: 'ease-out', duration: 750 })
}

const adminRoutes: Array<Route<any>> = [
  {
    url: '/file-browser',
    onVisit,
    onLeave,
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DrivesPage } = await import('../pages/file-browser/index.js')
          return <DrivesPage />
        }}
      />
    ),
  },
  {
    url: '/file-browser/openFile/:driveLetter/:path',
    onVisit,
    onLeave,
    component: ({ match }) => (
      <PiRatLazyLoad
        component={async () => {
          const { FilesPage } = await import('../pages/files/index.js')
          return <FilesPage letter={match.params.driveLetter} path={decodeURIComponent(match.params.path)} />
        }}
      />
    ),
  },
  {
    url: '/entities/drives',
    onVisit,
    onLeave,
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DrivesPage } = await import('../pages/entities/drives.js')
          return <DrivesPage />
        }}
      />
    ),
  },
  {
    url: '/entities/users',
    onVisit,
    onLeave,
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { UsersPage } = await import('../pages/entities/users.js')
          return <UsersPage />
        }}
      />
    ),
  },
  {
    url: '/entities/dashboards',
    onVisit,
    onLeave,
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { DashboardsPage } = await import('../pages/entities/dashboards.js')
          return <DashboardsPage />
        }}
      />
    ),
  },
  {
    url: '/entities/movie-libraries',
    onVisit,
    onLeave,
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { MovieLibrariesPage } = await import('../pages/entities/movie-libraries.js')
          return <MovieLibrariesPage />
        }}
      />
    ),
  },
  {
    url: '/entities/config',
    onVisit,
    onLeave,
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { ConfigPage } = await import('../pages/entities/config.js')
          return <ConfigPage />
        }}
      />
    ),
  },
]

export const Body = Shade<{ style?: Partial<CSSStyleDeclaration> }>({
  shadowDomName: 'shade-app-body',
  render: ({ useObservable, injector }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    const hasAdminRole = currentUser?.roles?.includes('admin') ?? false

    return (
      <div id="Body">
        {(() => {
          switch (sessionState) {
            case 'authenticated':
              return (
                <Router
                  routes={[
                    ...(hasAdminRole ? adminRoutes : []),
                    {
                      url: '/dashboards/:id',
                      onVisit,
                      onLeave,
                      component: ({ match }) => {
                        return <LoadableDashboard id={match.params.id} />
                      },
                    },
                    {
                      url: '/',
                      routingOptions: { end: false },
                      onVisit,
                      onLeave,
                      component: () => <DefaultDashboard />,
                    },
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
