import { createComponent, ScreenService, Shade } from '@furystack/shades'
import { AppBar, Button, cssVariableTheme, Dropdown, Icon, icons } from '@furystack/shades-common-components'
import type { MenuEntry } from '@furystack/shades-common-components'

import { AppBarAppLink } from '../routes/index.js'
import { environmentOptions } from '../environment-options.js'
import { navigateToRoute } from '../navigate-to-route.js'
import { SessionService } from '../services/session.js'
import { AiIcon } from './ai/ai-icon.js'
import { ChatIcon } from './chat/chat-icon.js'
import { PiRatCommandPalette } from './command-palette/index.js'
import { GithubLogo } from './github-logo/index.js'
import { PiRatLogo } from './pi-rat-logo.js'
import { ThemeSwitch } from './theme-switch/index.js'
import { UserAvatarMenu } from './user-avatar-menu.js'

export type HeaderProps = {
  title: string
}

const DesktopNavLinks = Shade({
  shadowDomName: 'shade-app-header-desktop-nav',
  css: {
    display: 'flex',
    placeContent: 'center',
    gap: cssVariableTheme.spacing.sm,
  },
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)
    const isAdmin = currentUser?.roles?.includes('admin') ?? false

    return (
      <>
        {isAdmin ? (
          <AppBarAppLink href="/file-browser" title="Drives">
            <Icon icon={icons.folderOpen} size="small" /> Files
          </AppBarAppLink>
        ) : null}
        <AppBarAppLink title="Movies" href="/movies">
          <Icon icon={icons.film} size="small" /> Movies
        </AppBarAppLink>
        <AppBarAppLink title="Series" href="/series">
          📺 Series
        </AppBarAppLink>
      </>
    )
  },
})

const MobileNavMenu = Shade({
  shadowDomName: 'shade-app-header-mobile-nav',
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)
    const isAdmin = currentUser?.roles?.includes('admin') ?? false

    const items: MenuEntry[] = [
      ...(isAdmin
        ? [{ key: '/file-browser', label: 'Files', icon: <Icon icon={icons.folderOpen} size="small" /> }]
        : []),
      { key: '/movies', label: 'Movies', icon: <Icon icon={icons.film} size="small" /> },
      { key: '/series', label: 'Series', icon: <span>📺</span> },
    ]

    return (
      <Dropdown
        items={items}
        placement="bottomLeft"
        onSelect={(key) => {
          navigateToRoute(injector, key as Parameters<typeof navigateToRoute>[1], {})
        }}
      >
        <Button variant="outlined">
          <Icon icon={icons.menu} size="small" />
        </Button>
      </Dropdown>
    )
  },
})

export const Header = Shade<HeaderProps>({
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
          {isDesktop ? props.title : null}
        </AppBarAppLink>
        {sessionState === 'authenticated' ? <>{isDesktop ? <DesktopNavLinks /> : <MobileNavMenu />}</> : null}

        <div className="header-spacer">{sessionState === 'authenticated' && <PiRatCommandPalette />}</div>

        <div className="header-actions">
          <ThemeSwitch />
          {isDesktop ? (
            <Button onclick={() => window.open(environmentOptions.repository)}>
              <GithubLogo style={{ height: '1rem' }} />
            </Button>
          ) : null}
          <ChatIcon />
          <AiIcon />
          {sessionState === 'authenticated' ? <UserAvatarMenu /> : null}
        </div>
      </AppBar>
    )
  },
})
