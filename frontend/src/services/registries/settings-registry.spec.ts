import { Injector } from '@furystack/inject'
import type { NestedRoute } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { SettingsRegistry } from './settings-registry.js'

const stubRoute = { component: () => undefined } as unknown as NestedRoute<unknown>

describe('SettingsRegistry', () => {
  it('should register and retrieve a settings route', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(SettingsRegistry)
      registry.registerSettingsRoute('/iot', stubRoute)

      expect(registry.getSettingsRoutes()['/iot']).toBe(stubRoute)
    })
  })

  it('should return empty object when no settings registered', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(SettingsRegistry)
      expect(registry.getSettingsRoutes()).toEqual({})
    })
  })

  it('should warn on duplicate settings route and overwrite', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(SettingsRegistry)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const route1 = { ...stubRoute }
      const route2 = { ...stubRoute }

      registry.registerSettingsRoute('/iot', route1)
      registry.registerSettingsRoute('/iot', route2)

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("'/iot'"))
      expect(registry.getSettingsRoutes()['/iot']).toBe(route2)

      warnSpy.mockRestore()
    })
  })
})
