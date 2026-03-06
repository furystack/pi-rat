import { createComponent, Shade } from '@furystack/shades'
import type { MenuEntry } from '@furystack/shades-common-components'
import { Avatar, cssVariableTheme, Dropdown, Icon, icons } from '@furystack/shades-common-components'
import { navigateToRoute } from '../navigate-to-route.js'
import { SessionService } from '../services/session.js'

export const UserAvatarMenu = Shade({
  shadowDomName: 'user-avatar-menu',
  css: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '8px',
    '& .avatar-fallback': {
      fontSize: cssVariableTheme.typography.fontSize.sm,
    },
  },
  render: ({ injector, useObservable }) => {
    const session = injector.getInstance(SessionService)
    const [currentUser] = useObservable('currentUser', session.currentUser)

    if (!currentUser) return null

    const isAdmin = currentUser?.roles?.includes('admin') ?? false

    const menuItems: MenuEntry[] = [
      {
        type: 'group',
        key: 'user-group',
        label: currentUser.username ?? '',
        children: [
          ...(isAdmin
            ? [
                {
                  key: 'app-settings',
                  label: 'Application Settings',
                  icon: (<Icon icon={icons.wrench} size="small" />) as JSX.Element,
                },
              ]
            : []),
          {
            key: 'user-settings',
            label: 'User Settings',
            icon: (<Icon icon={icons.user} size="small" />) as JSX.Element,
          },
          {
            key: 'about',
            label: 'About',
            icon: (<Icon icon={icons.info} size="small" />) as JSX.Element,
          },
          { type: 'divider' as const },
          {
            key: 'logout',
            label: 'Log Out',
            icon: (<Icon icon={icons.logOut} size="small" />) as JSX.Element,
          },
        ],
      },
    ]

    const handleSelect = (key: string) => {
      switch (key) {
        case 'app-settings':
          navigateToRoute(injector, '/app-settings')
          break
        case 'user-settings':
          navigateToRoute(injector, '/user/settings')
          break
        case 'about':
          navigateToRoute(injector, '/about')
          break
        case 'logout':
          void session.logout()
          break
        default:
          break
      }
    }

    return (
      <Dropdown items={menuItems} placement="bottomRight" onSelect={handleSelect}>
        <Avatar
          style={{ height: '32px', width: '32px', cursor: 'pointer' }}
          avatarUrl=""
          fallback={<span className="avatar-fallback">{currentUser.username?.charAt(0)?.toUpperCase()}</span>}
        />
      </Dropdown>
    )
  },
})
