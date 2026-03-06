import { createComponent, NestedRouter, Shade } from '@furystack/shades'
import { cssVariableTheme, PageLayout } from '@furystack/shades-common-components'
import type { AppBarVariant } from '@furystack/shades-common-components'

import { appRoutes, authRoutes } from '../routes/index.js'
import { Init, Offline } from '../pages/index.js'
import { SessionService } from '../services/session.js'
import { Header } from './header.js'

const DEFAULT_APPBAR_VARIANT: AppBarVariant = 'permanent'

export const Body = Shade({
  shadowDomName: 'shade-app-body',
  css: {
    width: '100%',
    height: '100%',
    color: cssVariableTheme.text.secondary,
  },
  render: ({ useObservable, injector, useState }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)
    const [appBarVariant] = useState<AppBarVariant>('appBarVariant', DEFAULT_APPBAR_VARIANT)

    switch (sessionState) {
      case 'authenticated':
        return (
          <PageLayout
            appBar={{
              variant: appBarVariant,
              component: <Header title="PI-Rat" />,
            }}
          >
            <NestedRouter routes={appRoutes} />
          </PageLayout>
        )
      case 'offline':
        return <Offline />
      case 'unauthenticated':
        return <NestedRouter routes={{ ...authRoutes }} />
      default:
        return <Init />
    }
  },
})
