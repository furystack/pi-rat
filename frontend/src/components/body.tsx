import { createComponent, Shade, Router, LazyLoad } from '@furystack/shades'
import { SessionService } from '../services/session'
import { Init, HelloWorld, Offline, Login } from '../pages'
import { Loader } from '@furystack/shades-common-components'

export const Body = Shade<{ style?: Partial<CSSStyleDeclaration> }>({
  shadowDomName: 'shade-app-body',
  render: ({ useObservable, injector }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)
    return (
      <div id="Body">
        {(() => {
          switch (sessionState) {
            case 'authenticated':
              return (
                <Router
                  routes={[
                    {
                      url: '/drives',
                      component: () => (
                        <LazyLoad
                          loader={<Loader />}
                          component={async () => {
                            const { DrivesPage } = await import('../pages/drives')
                            return <DrivesPage />
                          }}
                        />
                      ),
                    },
                    {
                      url: '/drives/openFile/:driveLetter/:path',
                      component: ({ match }) => (
                        <LazyLoad
                          loader={<Loader />}
                          component={async () => {
                            const { FilesPage } = await import('../pages/files')
                            return (
                              <FilesPage
                                letter={match.params.driveLetter}
                                path={decodeURIComponent(match.params.path)}
                              />
                            )
                          }}
                        />
                      ),
                    },
                    { url: '/', routingOptions: { end: false }, component: () => <HelloWorld /> },
                  ]}></Router>
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
