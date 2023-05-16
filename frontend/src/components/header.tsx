import { createComponent, Shade } from '@furystack/shades'
import { AppBar, AppBarLink, Button } from '@furystack/shades-common-components'
import { environmentOptions } from '../environment-options.js'
import { SessionService } from '../services/session.js'
import { GithubLogo } from './github-logo/index.js'
import { ThemeSwitch } from './theme-switch/index.js'
import { PiRatCommandPalette } from './command-palette/index.js'

export interface HeaderProps {
  title: string
}

const AdminLinks = Shade<{}>({
  shadowDomName: 'shade-app-header-admin-links',
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    const isAdmin = currentUser?.roles?.includes('admin') ?? false

    return isAdmin ? (
      <div style={{ display: 'flex', placeContent: 'center', marginRight: '24px', gap: '8px' }}>
        |
        <AppBarLink href="/file-browser" title="Drives">
          📂 File Browser
        </AppBarLink>{' '}
        |<AppBarLink href="/entities/drives">💽 Drives</AppBarLink>
        <AppBarLink href="/entities/users">👥 Users</AppBarLink>
        <AppBarLink href="/entities/dashboards">📔 Dashboards</AppBarLink>
      </div>
    ) : null
  },
})

export const Header = Shade<HeaderProps>({
  shadowDomName: 'shade-app-header',
  render: ({ props, injector, useObservable }) => {
    const [sessionState] = useObservable('sessionState', injector.getInstance(SessionService).state)

    return (
      <AppBar id="header">
        <AppBarLink title={props.title} href="/">
          {props.title}
        </AppBarLink>
        {sessionState === 'authenticated' ? (
          <>
            <AdminLinks />
          </>
        ) : null}

        <div style={{ flex: '1' }}>
          <PiRatCommandPalette />
        </div>
        <div style={{ display: 'flex', placeContent: 'center', marginRight: '24px' }}>
          <ThemeSwitch variant="outlined" />
          <a href={environmentOptions.repository} target="_blank">
            <Button variant="outlined" style={{ verticalAlign: 'baseline' }}>
              <GithubLogo style={{ height: '1em' }} />
            </Button>
          </a>
          {sessionState === 'authenticated' ? (
            <Button variant="outlined" onclick={() => injector.getInstance(SessionService).logout()}>
              Log Out
            </Button>
          ) : null}
        </div>
      </AppBar>
    )
  },
})
