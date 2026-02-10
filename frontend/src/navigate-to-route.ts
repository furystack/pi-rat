import type { Injector } from '@furystack/inject'
import { LocationService, compileRoute } from '@furystack/shades'

export const navigateToRoute = <T extends Record<string, string>>(
  injector: Injector,
  route: { url: string },
  params: T,
  queryString = '',
) => {
  const destinationPath = compileRoute(route.url, params)
  const fullPath = destinationPath + (queryString ? `?${queryString}` : '') || '/'
  window.history.pushState({}, '', fullPath)
  injector.getInstance(LocationService).updateState()
}
