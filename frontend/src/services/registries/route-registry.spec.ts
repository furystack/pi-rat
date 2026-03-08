import { Injector } from '@furystack/inject'
import type { NestedRoute } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { RouteRegistry } from './route-registry.js'

const stubRoute = { component: () => undefined } as unknown as NestedRoute<unknown>

describe('RouteRegistry', () => {
  it('should register and retrieve routes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(RouteRegistry)

      registry.registerRoutes({
        '/test': stubRoute,
      })

      const routes = registry.getRoutes()
      expect(routes).toHaveProperty('/test')
    })
  })

  it('should return an empty object when no routes registered', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(RouteRegistry)
      expect(registry.getRoutes()).toEqual({})
    })
  })

  it('should merge multiple route registrations', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(RouteRegistry)

      registry.registerRoutes({ '/a': stubRoute })
      registry.registerRoutes({ '/b': stubRoute })

      const routes = registry.getRoutes()
      expect(Object.keys(routes)).toEqual(['/a', '/b'])
    })
  })

  it('should warn on duplicate route and overwrite', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(RouteRegistry)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const route1 = { ...stubRoute }
      const route2 = { ...stubRoute }

      registry.registerRoutes({ '/dup': route1 })
      registry.registerRoutes({ '/dup': route2 })

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("'/dup'"))
      expect(registry.getRoutes()['/dup']).toBe(route2)

      warnSpy.mockRestore()
    })
  })
})
