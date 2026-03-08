import { getCurrentUser } from '@furystack/core'
import { createComponent } from '@furystack/shades'
import { Icon, icons } from '@furystack/shades-common-components'
import type { Injector } from '@furystack/inject'

import { createSuggestion, distinctByName } from '../components/command-palette/command-providers/create-suggestion.js'
import { DeviceAvailability } from '../components/dashboard/device-availability.js'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'
import { entityEditorChildren } from '../routes/entity-routes.js'
import { CommandProviderRegistry, EntityRouteRegistry, SettingsRegistry, WidgetRegistry } from './registries/index.js'

/**
 * Registers IoT plugin contributions to the frontend registries.
 *
 * The IoT page components still live in the core frontend because they depend
 * on core utilities (PiRatLazyLoad, GenericEditor, AppLink, etc.). Once shared
 * frontend utilities are extracted into a common package (Phase 2), these
 * registrations and their components will move to @pi-rat/iot-frontend.
 */
export const registerIotFrontend = (injector: Injector) => {
  injector.getInstance(WidgetRegistry).registerWidget('device-availability', (p) => <DeviceAvailability {...p} />)

  const iotSuggestion = {
    name: 'IOT Device Entities',
    description: 'List, edit and create IOT Device entities',
    icon: <Icon icon={icons.plug} size="small" />,
    score: 1,
    onSelected: ({ injector: i }: { injector: Injector }) => {
      i.getInstance(EntityRouteRegistry).navigateToEntityRoute(i, '/iot-devices')
    },
  }

  injector.getInstance(CommandProviderRegistry).registerProvider(async ({ term, injector: i }) => {
    if (!term) return []
    if (!(await getCurrentUser(i))?.roles?.includes('admin')) return []

    const suggestions = [iotSuggestion]
    const fullHits = suggestions
      .filter((c) => c.name.toLowerCase() === term.toLowerCase())
      .map((c) => createSuggestion({ ...c, score: 1 }))
    const contains = suggestions
      .filter((c) => c.name.toLowerCase().includes(term.toLowerCase()))
      .map((c) => createSuggestion({ ...c, score: 3 }))
    const descriptionContains = suggestions
      .filter((c) => c.description.toLowerCase().includes(term.toLowerCase()))
      .map((c) => createSuggestion({ ...c, score: 2 }))

    return distinctByName(...fullHits, ...contains, ...descriptionContains)
  })

  injector.getInstance(SettingsRegistry).registerSettingsRoute('/iot', {
    meta: { title: 'IoT Settings', icon: icons.plug },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { IotSettingsPage } = await import('../pages/admin/iot-settings.js')
          return <IotSettingsPage />
        }}
      />
    ),
  })

  injector.getInstance(EntityRouteRegistry).registerEntityRoute('/iot-devices', {
    meta: { title: 'IoT Devices', icon: icons.plug },
    component: () => (
      <PiRatLazyLoad
        component={async () => {
          const { IotDevicesPage } = await import('../pages/entities/iot-devices.js')
          return <IotDevicesPage />
        }}
      />
    ),
    children: entityEditorChildren,
  })
}
