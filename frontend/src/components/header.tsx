import { createComponent, ScreenService, Shade } from '@furystack/shades'
import { AppBar, cssVariableTheme } from '@furystack/shades-common-components'

import { AppBarAppLink } from '../routes/index.js'
import { SessionService } from '../services/session.js'
import { PiRatCommandPalette } from './command-palette/index.js'
import { PiRatLogo } from './pi-rat-logo.js'
import { RouteBreadcrumbs } from './route-breadcrumbs.js'
import { UserAvatarMenu } from './user-avatar-menu.js'

export const Header = Shade({
  shadowDomName: 'shade-app-header',
  css: {
    '& .header-spacer': {
      flex: '1',
    },
    '& .header-actions': {
      display: 'flex',
      placeContent: 'center',
      marginRight: cssVariableTheme.spacing.lg,
    },
  },
  render: ({ props, injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)
    const [isDesktop] = useObservable('isDesktop', injector.getInstance(ScreenService).screenSize.atLeast.md)

    return (
      <AppBar id="header">
        <AppBarAppLink title={props.title} href="/" routingOptions={{ end: false }}>
          <PiRatLogo size={24} style={{ marginRight: cssVariableTheme.spacing.sm }} />
        </AppBarAppLink>
        {isDesktop ? <RouteBreadcrumbs /> : null}

        <div className="header-spacer">{sessionState === 'authenticated' && <PiRatCommandPalette />}</div>

        <div className="header-actions">{sessionState === 'authenticated' ? <UserAvatarMenu /> : null}</div>
      </AppBar>
    )
  },
})
