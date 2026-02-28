import { createComponent, LocationService, Shade } from '@furystack/shades'
import { Drawer, Icon, icons, Menu, type MenuEntry } from '@furystack/shades-common-components'
import { match } from 'path-to-regexp'
import type { AppPaths } from '../../app-routes.js'
import { navigateToRoute } from '../../navigate-to-route.js'

type AppSettingsPageProps = {
  outlet?: JSX.Element
}

const menuItems: Array<MenuEntry & { href?: AppPaths }> = [
  {
    type: 'group',
    key: 'media',
    label: 'Media',
    children: [
      { key: '/app-settings/omdb', label: 'OMDB Settings', icon: <Icon icon={icons.film} size="small" /> },
      { key: '/app-settings/streaming', label: 'Streaming Settings', icon: <Icon icon={icons.play} size="small" /> },
    ],
  },
  {
    type: 'group',
    key: 'iot',
    label: 'IOT',
    children: [
      { key: '/app-settings/iot', label: 'Device Availability', icon: <Icon icon={icons.plug} size="small" /> },
    ],
  },
  {
    type: 'group',
    key: 'ai',
    label: 'AI',
    children: [{ key: '/app-settings/ai', label: 'Ollama Settings', icon: <Icon icon={icons.wand} size="small" /> }],
  },
  {
    type: 'group',
    key: 'identity',
    label: 'Identity',
    children: [{ key: '/app-settings/users', label: 'Users', icon: <Icon icon={icons.users} size="small" /> }],
  },
]

const settingsRoutes = menuItems.flatMap((entry) => ('children' in entry ? entry.children.map((c) => c.key) : []))

const getSelectedKey = (currentPath: string) =>
  settingsRoutes.find((route) => !!match(route)(currentPath)) ?? settingsRoutes[0]

export const AppSettingsPage = Shade<AppSettingsPageProps>({
  shadowDomName: 'app-settings-page',
  css: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    '& .settings-layout': {
      display: 'flex',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      marginTop: '48px',
    },
    '& .settings-content': {
      flex: '1',
      overflow: 'auto',
      padding: '24px 48px',
    },
  },
  render: ({ props, injector, useObservable }) => {
    const [currentPath] = useObservable('locationChange', injector.getInstance(LocationService).onLocationPathChanged)
    const selectedKey = getSelectedKey(currentPath)

    const handleSelect = (key: string) => {
      navigateToRoute(injector, key as AppPaths)
    }

    return (
      <div className="settings-layout">
        <Drawer position="left" variant="permanent">
          <Menu items={menuItems} selectedKey={selectedKey} onSelect={handleSelect} />
        </Drawer>
        <div className="settings-content">{props.outlet}</div>
      </div>
    )
  },
})
