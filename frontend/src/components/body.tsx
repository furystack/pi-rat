import { createComponent, NestedRouter, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'
import { authRoutes, createAppRoutes } from '../routes/index.js'
import { Init, Offline } from '../pages/index.js'
import { RouteRegistry } from '../services/registries/index.js'
import { SessionService } from '../services/session.js'

export const Body = Shade({
  customElementName: 'shade-app-body',
  css: {
    color: cssVariableTheme.text.secondary,
  },
  render: ({ useObservable, injector }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)

    switch (sessionState) {
      case 'authenticated': {
        const coreRoutes = createAppRoutes(injector)
        const pluginRoutes = injector.getInstance(RouteRegistry).getRoutes()
        return <NestedRouter routes={{ ...coreRoutes, ...pluginRoutes }} />
      }
      case 'offline':
        return <Offline />
      case 'unauthenticated':
        return <NestedRouter routes={{ ...authRoutes }} />
      default:
        return <Init />
    }
  },
})
