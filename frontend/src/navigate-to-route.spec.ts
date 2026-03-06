import { Injector } from '@furystack/inject'
import { LocationService } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { navigateToRoute } from './navigate-to-route.js'

describe('navigateToRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call navigate with the path', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const navigate = vi.fn()
      const replace = vi.fn()
      injector.setExplicitInstance({ navigate, replace } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/movies')

      expect(navigate).toHaveBeenCalledWith('/movies')
    })
  })

  it('should compile route with params', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const navigate = vi.fn()
      const replace = vi.fn()
      injector.setExplicitInstance({ navigate, replace } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/movies/:imdbId/overview', { imdbId: 'tt1234567' })

      expect(navigate).toHaveBeenCalledWith('/movies/tt1234567/overview')
    })
  })

  it('should append queryString when provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const navigate = vi.fn()
      const replace = vi.fn()
      injector.setExplicitInstance({ navigate, replace } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/entities/movies', {}, { queryString: 'gedst=%7B%22mode%22%3A%22edit%22%7D' })

      expect(navigate).toHaveBeenCalledWith('/entities/movies?gedst=%7B%22mode%22%3A%22edit%22%7D')
    })
  })

  it('should call replace when options.replace is true', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const navigate = vi.fn()
      const replace = vi.fn()
      injector.setExplicitInstance({ navigate, replace } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/app-settings/omdb', {}, { replace: true })

      expect(replace).toHaveBeenCalledWith('/app-settings/omdb')
      expect(navigate).not.toHaveBeenCalled()
    })
  })

  it('should call navigate by default (replace not set)', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const navigate = vi.fn()
      const replace = vi.fn()
      injector.setExplicitInstance({ navigate, replace } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/series')

      expect(navigate).toHaveBeenCalled()
      expect(replace).not.toHaveBeenCalled()
    })
  })

  it('should navigate to path without params when none provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const navigate = vi.fn()
      const replace = vi.fn()
      injector.setExplicitInstance({ navigate, replace } as unknown as LocationService, LocationService)

      navigateToRoute(injector, '/chat')

      expect(navigate).toHaveBeenCalledWith('/chat')
    })
  })
})
