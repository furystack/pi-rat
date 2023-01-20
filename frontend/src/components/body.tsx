import { createComponent, Shade, Router } from '@furystack/shades'
import { SessionService } from '../services/session'
import { Init, HelloWorld, Offline, Login } from '../pages'
import { DrivesPage } from '../pages/drives'

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
                    { url: '/drives', routingOptions: { end: false }, component: () => <DrivesPage /> },
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
