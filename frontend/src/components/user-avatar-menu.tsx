import { createComponent, Shade } from '@furystack/shades'
import { Avatar, Button, Icon, icons, Paper } from '@furystack/shades-common-components'
import { navigateToRoute } from '../navigate-to-route.js'
import { SessionService } from '../services/session.js'

export const UserAvatarMenu = Shade({
  shadowDomName: 'user-avatar-menu',
  css: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '8px',
    '& .dropdown-menu': {
      position: 'absolute',
      top: '40px',
      right: '0',
      zIndex: '1000',
    },
    '& .menu-content': {
      padding: '8px',
    },
    '& .menu-username': {
      padding: '8px 12px',
      fontSize: '12px',
      color: 'var(--theme-text-secondary)',
      borderBottom: '1px solid var(--theme-border-default)',
      marginBottom: '4px',
    },
    '& .menu-button': {
      width: '100%',
      justifyContent: 'flex-start',
      padding: '8px 12px',
      fontSize: '14px',
      background: 'transparent',
      border: 'none',
      color: 'var(--theme-text-primary)',
    },
    '& .menu-overlay': {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '999',
    },
    '& .avatar-fallback': {
      fontSize: '14px',
    },
  },
  render: ({ injector, useObservable, useState }) => {
    const session = injector.getInstance(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)
    const [isMenuOpen, setIsMenuOpen] = useState('isMenuOpen', false)

    if (!currentUser) return null

    const isAdmin = currentUser?.roles?.includes('admin') ?? false

    const handleAppSettingsClick = () => {
      navigateToRoute(injector, '/app-settings')
      setIsMenuOpen(false)
    }

    const handleSettingsClick = () => {
      navigateToRoute(injector, '/user/settings')
      setIsMenuOpen(false)
    }

    const handleLogoutClick = () => {
      void session.logout()
      setIsMenuOpen(false)
    }

    return (
      <>
        <Avatar
          style={{ height: '32px', width: '32px', cursor: 'pointer' }}
          avatarUrl=""
          fallback={<span className="avatar-fallback">{currentUser.username?.charAt(0)?.toUpperCase()}</span>}
          onclick={() => setIsMenuOpen(!isMenuOpen)}
        />

        {isMenuOpen && (
          <Paper className="dropdown-menu" onclick={(e) => e.stopPropagation()}>
            <div className="menu-content">
              <div className="menu-username">{currentUser.username}</div>

              {isAdmin && (
                <Button className="menu-button" onclick={handleAppSettingsClick}>
                  <Icon icon={icons.wrench} size="small" /> Application Settings
                </Button>
              )}

              <Button className="menu-button" onclick={handleSettingsClick}>
                <Icon icon={icons.user} size="small" /> User Settings
              </Button>

              <Button className="menu-button" onclick={handleLogoutClick}>
                <Icon icon={icons.logOut} size="small" /> Log Out
              </Button>
            </div>
          </Paper>
        )}

        {isMenuOpen && <div className="menu-overlay" onclick={() => setIsMenuOpen(false)} />}
      </>
    )
  },
})
