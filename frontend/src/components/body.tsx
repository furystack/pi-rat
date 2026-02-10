import { createComponent, NestedRouter, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'
import { appRoutes, authRoutes } from '../app-routes.js'
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

    switch (sessionState) {
      case 'authenticated':
        return <NestedRouter routes={appRoutes} />
      case 'offline':
        return <Offline />
      case 'unauthenticated':
        return <NestedRouter routes={{ ...authRoutes }} />
      default:
        return <Init />
    }
  },
})
