import { createComponent, Shade, Router } from '@furystack/shades'
import type { User } from 'common'
import type { SessionState } from '../services/session'
import { SessionService } from '../services/session'
import { Init, HelloWorld, Offline, Login } from '../pages'
import { DrivesPage } from '../pages/drives'

export const Body = Shade<
  { style?: Partial<CSSStyleDeclaration> },
  { sessionState: SessionState; currentUser: User | null }
>({
  shadowDomName: 'shade-app-body',
  getInitialState: () => ({
    sessionState: 'initializing',
    currentUser: null as User | null,
  }),
  resources: ({ injector, updateState }) => {
    const session = injector.getInstance(SessionService)
    session.init()
    return [
      session.state.subscribe((newState) =>
        updateState({
          sessionState: newState,
        }),
      ),
      session.currentUser.subscribe((usr) => updateState({ currentUser: usr })),
    ]
  },
  render: ({ getState }) => {
    return (
      <div id="Body">
        {(() => {
          switch (getState().sessionState) {
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
