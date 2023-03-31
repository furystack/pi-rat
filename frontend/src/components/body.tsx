import type { Route } from '@furystack/shades'
import { createComponent, Shade, Router } from '@furystack/shades'
import { SessionService } from '../services/session'
import { Init, Offline, Login } from '../pages'
import { fadeOut, fadeIn } from '@furystack/shades-common-components'
import { DefaultDashboard } from './dashboard/default-dashboard'
import { LoadableDashboard } from './dashboard/LoadableDashboard'
import { PiRatLazyLoad } from './pirat-lazy-load'

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
          const { DrivesPage } = await import('../pages/file-browser')
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
          const { FilesPage } = await import('../pages/files')
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
          const { DrivesPage } = await import('../pages/entities/drives')
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
          const { UsersPage } = await import('../pages/entities/users')
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
          const { DashboardsPage } = await import('../pages/entities/dashboards')
          return <DashboardsPage />
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
