import { createComponent } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import type { Injector } from '@furystack/inject'
import type { DeviceAvailability as DeviceAvailabilityData } from 'common'

import { DeviceAvailability } from '../components/dashboard/device-availability.js'
import { PiRatLazyLoad } from '../components/pirat-lazy-load.js'
import { entityEditorChildren } from '../routes/entity-routes.js'
import { EntityRouteRegistry, SettingsRegistry, WidgetRegistry } from './registries/index.js'

/**
 * Registers IoT plugin contributions to the frontend registries.
 *
 * The IoT page components still live in the core frontend because they depend
 * on core utilities (PiRatLazyLoad, GenericEditor, AppLink, etc.). Once shared
 * frontend utilities are extracted into a common package (Phase 2), these
 * registrations and their components will move to @pi-rat/iot-frontend.
 */
export const registerIotFrontend = (injector: Injector) => {
  injector
    .getInstance(WidgetRegistry)
    .registerWidget('device-availability', (p) => <DeviceAvailability {...(p as DeviceAvailabilityData)} />)

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
