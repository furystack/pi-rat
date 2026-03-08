import { Injector } from '@furystack/inject'
import type { NestedRoute } from '@furystack/shades'
import { LocationService } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { EntityRouteRegistry } from './entity-route-registry.js'

const stubRoute = { component: () => undefined } as unknown as NestedRoute<unknown>

describe('EntityRouteRegistry', () => {
  it('should register and retrieve an entity route', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(EntityRouteRegistry)
      registry.registerEntityRoute('/devices', stubRoute)

      const routes = registry.getEntityRoutes()
      expect(routes['/devices']).toBe(stubRoute)
    })
  })

  it('should return empty object when no routes registered', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(EntityRouteRegistry)
      expect(registry.getEntityRoutes()).toEqual({})
    })
  })

  it('should warn on duplicate entity route and overwrite', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(EntityRouteRegistry)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const route1 = { ...stubRoute }
      const route2 = { ...stubRoute }

      registry.registerEntityRoute('/devices', route1)
      registry.registerEntityRoute('/devices', route2)

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("'/devices'"))
      expect(registry.getEntityRoutes()['/devices']).toBe(route2)

      warnSpy.mockRestore()
    })
  })

  describe('navigateToEntityRoute', () => {
    it('should navigate to entity route with /entities prefix', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const navigate = vi.fn()
        const replace = vi.fn()
        injector.setExplicitInstance({ navigate, replace } as unknown as LocationService, LocationService)
        const registry = injector.getInstance(EntityRouteRegistry)
        registry.registerEntityRoute('/devices', stubRoute)

        registry.navigateToEntityRoute(injector, '/devices')

        expect(navigate).toHaveBeenCalledWith('/entities/devices')
      })
    })

    it('should use replace when options.replace is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const navigate = vi.fn()
        const replace = vi.fn()
        injector.setExplicitInstance({ navigate, replace } as unknown as LocationService, LocationService)
        const registry = injector.getInstance(EntityRouteRegistry)
        registry.registerEntityRoute('/devices', stubRoute)

        registry.navigateToEntityRoute(injector, '/devices', { replace: true })

        expect(replace).toHaveBeenCalledWith('/entities/devices')
        expect(navigate).not.toHaveBeenCalled()
      })
    })

    it('should append queryString when provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const navigate = vi.fn()
        const replace = vi.fn()
        injector.setExplicitInstance({ navigate, replace } as unknown as LocationService, LocationService)
        const registry = injector.getInstance(EntityRouteRegistry)
        registry.registerEntityRoute('/devices', stubRoute)

        registry.navigateToEntityRoute(injector, '/devices', { queryString: 'mode=edit' })

        expect(navigate).toHaveBeenCalledWith('/entities/devices?mode=edit')
      })
    })

    it('should warn when navigating to unregistered route', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const navigate = vi.fn()
        injector.setExplicitInstance({ navigate } as unknown as LocationService, LocationService)
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const registry = injector.getInstance(EntityRouteRegistry)

        registry.navigateToEntityRoute(injector, '/unknown')

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("'/unknown'"))
        expect(navigate).toHaveBeenCalledWith('/entities/unknown')

        warnSpy.mockRestore()
      })
    })
  })
})
