import './route-meta-augmentation.js'

import type { Injector } from '@furystack/inject'
import { NestedRouteLink, type ChildrenList, type NestedRoute, type TypedNestedRouteLinkProps } from '@furystack/shades'
import { AppBarLink, type AppBarLinkProps } from '@furystack/shades-common-components'

import { authRoutes as _authRoutes } from './auth-routes.js'
import { createEntityRoute, entityRoute } from './entity-routes.js'
import { fileBrowserRoute } from './file-browser-routes.js'
import { iotRoute } from './iot-routes.js'
import { loggingRoute } from './logging-routes.js'
import { miscRoutes } from './misc-routes.js'
import { movieRoutes } from './movie-routes.js'
import { seriesRoutes } from './series-routes.js'
import { createSettingsRoute, settingsRoute } from './settings-routes.js'
import { userRoute } from './user-routes.js'

type ConcatPaths<Parent extends string, Child extends string> = Parent extends '/' ? Child : `${Parent}${Child}`

type ExtractRoutePaths<T extends Record<string, NestedRoute<any>>> = {
  [K in keyof T & string]:
    | K
    | (T[K] extends { children: infer C extends Record<string, NestedRoute<any>> }
        ? ConcatPaths<K, ExtractRoutePaths<C> & string>
        : never)
}[keyof T & string]

export const appRoutes = {
  ...movieRoutes,
  ...seriesRoutes,
  '/app-settings': settingsRoute,
  '/entities': entityRoute,
  '/file-browser': fileBrowserRoute,
  '/iot': iotRoute,
  '/logging': loggingRoute,
  '/user': userRoute,
  ...miscRoutes,
}

/**
 * Creates the full app routes with registry-aware settings and entity routes
 */
export const createAppRoutes = (injector: Injector) => ({
  ...movieRoutes,
  ...seriesRoutes,
  '/app-settings': createSettingsRoute(injector),
  '/entities': createEntityRoute(injector),
  '/file-browser': fileBrowserRoute,
  '/iot': iotRoute,
  '/logging': loggingRoute,
  '/user': userRoute,
  ...miscRoutes,
})

export const authRoutes = _authRoutes

export type AppPaths = ExtractRoutePaths<typeof appRoutes & typeof authRoutes>

export const AppLink = NestedRouteLink as unknown as <TPath extends AppPaths>(
  props: TypedNestedRouteLinkProps<TPath>,
  children?: ChildrenList,
) => JSX.Element

export const AppBarAppLink = AppBarLink as unknown as <TPath extends AppPaths>(
  props: AppBarLinkProps & { href: TPath },
  children?: ChildrenList,
) => JSX.Element
