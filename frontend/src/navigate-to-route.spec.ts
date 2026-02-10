import { Injector } from '@furystack/inject'
import { LocationService } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { navigateToRoute } from './navigate-to-route.js'

describe('navigateToRoute', () => {
  let pushStateSpy: ReturnType<typeof vi.spyOn>
  let replaceStateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    pushStateSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
    replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call pushState with the path', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const updateState = vi.fn()
      injector.setExplicitInstance({ updateState } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/movies')

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/movies')
    })
  })

  it('should call LocationService.updateState()', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const updateState = vi.fn()
      injector.setExplicitInstance({ updateState } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/movies')

      expect(updateState).toHaveBeenCalled()
    })
  })

  it('should compile route with params', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const updateState = vi.fn()
      injector.setExplicitInstance({ updateState } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/movies/:imdbId/overview', { imdbId: 'tt1234567' })

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/movies/tt1234567/overview')
    })
  })

  it('should append queryString when provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const updateState = vi.fn()
      injector.setExplicitInstance({ updateState } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/entities/movies', {}, { queryString: 'gedst=%7B%22mode%22%3A%22edit%22%7D' })

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/entities/movies?gedst=%7B%22mode%22%3A%22edit%22%7D')
    })
  })

  it('should call replaceState when options.replace is true', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const updateState = vi.fn()
      injector.setExplicitInstance({ updateState } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/app-settings/omdb', {}, { replace: true })

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/app-settings/omdb')
      expect(pushStateSpy).not.toHaveBeenCalled()
    })
  })

  it('should call pushState by default (replace not set)', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const updateState = vi.fn()
      injector.setExplicitInstance({ updateState } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/series')

      expect(pushStateSpy).toHaveBeenCalled()
      expect(replaceStateSpy).not.toHaveBeenCalled()
    })
  })

  it('should navigate to path without params when none provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const updateState = vi.fn()
      injector.setExplicitInstance({ updateState } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/chat')

      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/chat')
    })
  })
})
