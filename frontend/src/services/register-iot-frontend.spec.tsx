import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { CommandProviderRegistry, EntityRouteRegistry, SettingsRegistry, WidgetRegistry } from './registries/index.js'
import { IOT_ENTITY_ROUTE, registerIotFrontend } from './register-iot-frontend.js'

describe('registerIotFrontend', () => {
  it('should register a device-availability widget renderer', async () => {
    await usingAsync(new Injector(), async (injector) => {
      registerIotFrontend(injector)

      const widgetRegistry = injector.getInstance(WidgetRegistry)
      expect(widgetRegistry.getRenderer('device-availability')).toBeDefined()
    })
  })

  it('should register a command provider', async () => {
    await usingAsync(new Injector(), async (injector) => {
      registerIotFrontend(injector)

      const commandRegistry = injector.getInstance(CommandProviderRegistry)
      expect(commandRegistry.getProviders()).toHaveLength(1)
    })
  })

  it('should register the /iot settings route', async () => {
    await usingAsync(new Injector(), async (injector) => {
      registerIotFrontend(injector)

      const settingsRegistry = injector.getInstance(SettingsRegistry)
      const routes = settingsRegistry.getSettingsRoutes()
      expect(routes['/iot']).toBeDefined()
      expect(routes['/iot'].meta?.title).toBe('IoT Settings')
    })
  })

  it('should register the IoT entity route', async () => {
    await usingAsync(new Injector(), async (injector) => {
      registerIotFrontend(injector)

      const entityRouteRegistry = injector.getInstance(EntityRouteRegistry)
      const routes = entityRouteRegistry.getEntityRoutes()
      expect(routes[IOT_ENTITY_ROUTE]).toBeDefined()
      expect(routes[IOT_ENTITY_ROUTE].meta?.title).toBe('IoT Devices')
      expect(routes[IOT_ENTITY_ROUTE].children).toBeDefined()
    })
  })
})
