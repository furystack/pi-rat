import type { Route } from '@furystack/shades'
import { LocationService } from '@furystack/shades'
import { compile } from 'path-to-regexp'
import type { Injector } from '@furystack/inject'

export const navigateToRoute = <T extends object>(injector: Injector, route: Route<T>, params: T, queryString = '') => {
  const destinationPath = compile(route.url)(params)
  window.history.pushState({}, '', destinationPath + (queryString ? `?${queryString}` : ''))
  injector.getInstance(LocationService).updateState()
}
