import { createComponent, Shade, type Route } from '@furystack/shades'
import { Avatar, Button, Paper } from '@furystack/shades-common-components'
import { navigateToRoute } from '../navigate-to-route.js'
import { SessionService } from '../services/session.js'

export const UserAvatarMenu = Shade({
  shadowDomName: 'user-avatar-menu',
  style: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '8px' },
  render: ({ injector, useObservable, useState }) => {
    const session = injector.getInstance(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)
    const [isMenuOpen, setIsMenuOpen] = useState('isMenuOpen', false)

    if (!currentUser) return null

    const isAdmin = currentUser?.roles?.includes('admin') ?? false

    const handleAdminSettingsClick = () => {
      const adminSettingsRoute: Route<Record<string, never>> = {
        url: '/admin',
        component: () => <div>Loading...</div>,
      }
      navigateToRoute(injector, adminSettingsRoute, {})
      setIsMenuOpen(false)
    }

    const handleSettingsClick = () => {
      // Navigate to user settings - defining inline to avoid import issues
      const userSettingsRoute: Route<Record<string, never>> = {
        url: '/user/settings',
        component: () => <div>Loading...</div>,
      }
      navigateToRoute(injector, userSettingsRoute, {})
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
          fallback={<span style={{ fontSize: '14px' }}>{currentUser.username?.charAt(0)?.toUpperCase()}</span>}
          onclick={() => setIsMenuOpen(!isMenuOpen)}
        />

        {isMenuOpen && (
          <Paper
            style={{
              position: 'absolute',
              top: '40px',
              right: '0',

              zIndex: '1000',
            }}
            onclick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '8px' }}>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'var(--theme-text-secondary)',
                  borderBottom: '1px solid var(--theme-border-default)',
                  marginBottom: '4px',
                }}
              >
                {currentUser.username}
              </div>

              {isAdmin && (
                <Button
                  onclick={handleAdminSettingsClick}
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '8px 12px',
                    fontSize: '14px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--theme-text-primary)',
                  }}
                >
                  ⚙️ Admin Settings
                </Button>
              )}

              <Button
                onclick={handleSettingsClick}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 12px',
                  fontSize: '14px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--theme-text-primary)',
                }}
              >
                👤 User Settings
              </Button>

              <Button
                onclick={handleLogoutClick}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 12px',
                  fontSize: '14px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--theme-text-primary)',
                }}
              >
                🚪 Log Out
              </Button>
            </div>
          </Paper>
        )}

        {/* Invisible overlay to close menu when clicking outside */}
        {isMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100vw',
              height: '100vh',
              zIndex: '999',
            }}
            onclick={() => setIsMenuOpen(false)}
          />
        )}
      </>
    )
  },
})
