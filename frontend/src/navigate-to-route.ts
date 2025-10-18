import type { Injector } from '@furystack/inject'
import type { Route } from '@furystack/shades'
import { LocationService } from '@furystack/shades'
import { compile } from 'path-to-regexp'

export const navigateToRoute = <T extends object>(injector: Injector, route: Route<T>, params: T, queryString = '') => {
  const destinationPath = compile(route.url)(params)
  const fullPath = destinationPath + (queryString ? `?${queryString}` : '') || '/'
  window.history.pushState({}, '', fullPath)
  injector.getInstance(LocationService).updateState()
}
