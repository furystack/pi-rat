import './route-meta-augmentation.js'

import { defineNestedRoutes, type ExtractRoutePaths } from '@furystack/shades'
import { createAppBarLink } from '@furystack/shades-common-components'

import { authRoutes as _authRoutes } from './auth-routes.js'
import { entityRoute } from './entity-routes.js'
import { fileBrowserRoute } from './file-browser-routes.js'
import { iotRoute } from './iot-routes.js'
import { loggingRoute } from './logging-routes.js'
import { miscRoutes } from './misc-routes.js'
import { movieRoutes } from './movie-routes.js'
import { seriesRoutes } from './series-routes.js'
import { settingsRoute } from './settings-routes.js'
import { userRoute } from './user-routes.js'

import { createNestedRouteLink } from '@furystack/shades'

export const appRoutes = defineNestedRoutes({
  ...movieRoutes,
  ...seriesRoutes,
  '/app-settings': settingsRoute,
  '/entities': entityRoute,
  '/file-browser': fileBrowserRoute,
  '/iot': iotRoute,
  '/logging': loggingRoute,
  '/user': userRoute,
  ...miscRoutes,
})

export const authRoutes = _authRoutes

export type AppPaths = ExtractRoutePaths<typeof appRoutes & typeof authRoutes>

export const AppLink = createNestedRouteLink<typeof appRoutes & typeof authRoutes>()

export const AppBarAppLink = createAppBarLink<typeof appRoutes & typeof authRoutes>()
