import { createComponent, Shade } from '@furystack/shades'
import { AppBar, AppBarLink, Button } from '@furystack/shades-common-components'
import { environmentOptions } from '../environment-options.js'
import { SessionService } from '../services/session.js'
import { AiIcon } from './ai/ai-icon.js'
import { ChatIcon } from './chat/chat-icon.js'
import { PiRatCommandPalette } from './command-palette/index.js'
import { GithubLogo } from './github-logo/index.js'
import { defaultDashboardRoute } from './routes/dashboard-routes.js'
import { fileBrowserRoute } from './routes/file-browser-routes.js'
import { movieListRoute, seriesListRoute } from './routes/movie-routes.js'
import { ThemeSwitch } from './theme-switch/index.js'

export interface HeaderProps {
  title: string
}

const AdminLinks = Shade({
  shadowDomName: 'shade-app-header-admin-links',
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    const isAdmin = currentUser?.roles?.includes('admin') ?? false

    return isAdmin ? (
      <div style={{ display: 'flex', placeContent: 'center', gap: '8px' }}>
        <AppBarLink href={fileBrowserRoute.url} title="Drives">
          📂 Files
        </AppBarLink>
      </div>
    ) : null
  },
})

export const Header = Shade<HeaderProps>({
  shadowDomName: 'shade-app-header',
  render: ({ props, injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    return (
      <AppBar id="header">
        <AppBarLink title={props.title} href={defaultDashboardRoute.url}>
          {props.title}
        </AppBarLink>
        {sessionState === 'authenticated' ? (
          <>
            {currentUser?.roles?.includes('admin') ? <AdminLinks /> : null}

            <AppBarLink title="Movies" href={movieListRoute.url}>
              🎥 Movies
            </AppBarLink>

            <AppBarLink title="Series" href={seriesListRoute.url}>
              📺 Series
            </AppBarLink>
          </>
        ) : null}

        <div style={{ flex: '1' }}>{sessionState === 'authenticated' && <PiRatCommandPalette />}</div>

        <div style={{ display: 'flex', placeContent: 'center', marginRight: '24px' }}>
          <ThemeSwitch />
          <Button
            onclick={() => {
              window.open(environmentOptions.repository)
            }}
          >
            <GithubLogo style={{ height: '1rem' }} />
          </Button>
          <ChatIcon />
          <AiIcon />
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
