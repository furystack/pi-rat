import { createComponent, LocationService, Shade } from '@furystack/shades'
import { Drawer, DrawerToggleButton, Icon, icons, Menu, type MenuEntry } from '@furystack/shades-common-components'
import { match } from 'path-to-regexp'

import type { AppPaths } from '../../routes/index.js'
import { navigateToRoute } from '../../navigate-to-route.js'

type AppSettingsPageProps = {
  outlet?: JSX.Element
}

const getMenuItems = (): Array<MenuEntry & { href?: AppPaths }> => [
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

const getSettingsRoutes = () =>
  getMenuItems().flatMap((entry) => ('children' in entry ? entry.children.flatMap((c) => (c.key ? [c.key] : [])) : []))

const getSelectedKey = (currentPath: string) => {
  const routes = getSettingsRoutes()
  return routes.find((route) => !!match(route)(currentPath)) ?? routes[0]
}

export const AppSettingsPage = Shade<AppSettingsPageProps>({
  shadowDomName: 'app-settings-page',
  css: {
    '& .settings-toggle': {
      position: 'absolute',
      top: '8px',
      left: '8px',
      zIndex: '1',
    },
  },
  render: ({ props, injector, useObservable }) => {
    const [currentPath] = useObservable('locationChange', injector.getInstance(LocationService).onLocationPathChanged)
    const selectedKey = getSelectedKey(currentPath)

    const handleSelect = (key: string) => {
      navigateToRoute(injector, key as AppPaths, {})
    }

    return (
      <>
        <div className="settings-toggle">
          <DrawerToggleButton position="left" />
        </div>
        <Drawer position="left" variant="collapsible" collapseOnBreakpoint="md" defaultOpen>
          <Menu items={getMenuItems()} selectedKey={selectedKey} onSelect={handleSelect} />
        </Drawer>
        {props.outlet}
      </>
    )
  },
})
