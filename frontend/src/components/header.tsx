import { createComponent, Shade } from '@furystack/shades'
import { AppBar, AppBarLink, Button } from '@furystack/shades-common-components'
import { environmentOptions } from '../environment-options'
import { SessionService } from '../services/session'
import { GithubLogo } from './github-logo'
import { ThemeSwitch } from './theme-switch'

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
        <AppBarLink href="/drives" title="Drives">
          💽 Browser
        </AppBarLink>
        <AppBarLink href="/entities/drives">📦 Drives</AppBarLink>
        <AppBarLink href="/entities/users">👥 Users</AppBarLink>
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
        <div style={{ flex: '1' }} />
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
