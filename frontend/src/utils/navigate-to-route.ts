import type { Injector } from '@furystack/inject'
import type { ExtractRouteParams } from '@furystack/shades'
import { LocationService, compileRoute } from '@furystack/shades'
import type { AppPaths } from '../routes/index.js'

export type NavigateOptions = { queryString?: string; replace?: boolean }

export const navigateToRoute = <TPath extends AppPaths>(
  injector: Injector,
  path: TPath,
  ...args: string extends keyof ExtractRouteParams<TPath>
    ? [params?: Record<string, string>, options?: NavigateOptions]
    : [params: ExtractRouteParams<TPath>, options?: NavigateOptions]
) => {
  const [params, options] = args
  const destinationPath = params ? compileRoute(path, params) : path
  const fullPath = destinationPath + (options?.queryString ? `?${options.queryString}` : '') || '/'
  const locationService = injector.getInstance(LocationService)
  if (options?.replace) {
    locationService.replace(fullPath)
  } else {
    locationService.navigate(fullPath)
  }
}
