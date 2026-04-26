import { createComponent, Shade } from '@furystack/shades'
import { AppBar, Button, Icon, icons } from '@furystack/shades-common-components'
import { AppBarAppLink } from '../routes/index.js'
import { environmentOptions } from '../utils/environment-options.js'
import { SessionService } from '../services/session.js'
import { AiIcon } from './ai/ai-icon.js'
import { ChatIcon } from './chat/chat-icon.js'
import { PiRatCommandPalette } from './command-palette/index.js'
import { GithubLogo } from './github-logo/index.js'
import { PiRatLogo } from './pi-rat-logo.js'
import { ThemeSwitch } from './theme-switch/index.js'
import { UserAvatarMenu } from './user-avatar-menu.js'

export interface HeaderProps {
  title: string
}

const AdminLinks = Shade({
  customElementName: 'shade-app-header-admin-links',
  css: {
    display: 'flex',
    placeContent: 'center',
    gap: '8px',
  },
  render: ({ injector, useObservable }) => {
    const session = injector.get(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    const isAdmin = currentUser?.roles?.includes('admin') ?? false

    return isAdmin ? (
      <AppBarAppLink path="/file-browser" title="Drives">
        <Icon icon={icons.folderOpen} size="small" /> Files
      </AppBarAppLink>
    ) : null
  },
})

export const Header = Shade<HeaderProps>({
  customElementName: 'shade-app-header',
  css: {
    '& .header-spacer': {
      flex: '1',
    },
    '& .header-actions': {
      display: 'flex',
      placeContent: 'center',
      marginRight: '24px',
    },
  },
  render: ({ props, injector, useObservable }) => {
    const session = injector.get(SessionService)
    const [sessionState] = useObservable('sessionState', session.state)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    return (
      <AppBar id="header">
        <AppBarAppLink title={props.title} path="/" routingOptions={{ end: false }}>
          <PiRatLogo size={24} style={{ marginRight: '8px' }} />
          {props.title}
        </AppBarAppLink>
        {sessionState === 'authenticated' ? (
          <>
            {currentUser?.roles?.includes('admin') ? <AdminLinks /> : null}

            <AppBarAppLink title="Movies" path="/movies">
              <Icon icon={icons.film} size="small" /> Movies
            </AppBarAppLink>

            <AppBarAppLink title="Series" path="/series">
              📺 Series
            </AppBarAppLink>
          </>
        ) : null}

        <div className="header-spacer">{sessionState === 'authenticated' && <PiRatCommandPalette />}</div>

        <div className="header-actions">
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
          {sessionState === 'authenticated' ? <UserAvatarMenu /> : null}
        </div>
      </AppBar>
    )
  },
})
