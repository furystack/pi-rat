import '@furystack/repository'
import { injector as rootInjector } from './root-injector'
import { attachShutdownHandler } from './shutdown-handler'
import { getLogger } from '@furystack/logging'
import { setupDrives } from './drives/setup-drives'
import { setupIdentity } from './identity/setup-identity'
import { setupFrontendBundle } from './setup-frontend-bundle'
import { setupInstall } from './install/setup-install'
import { setupDashboards } from './dashboards/setup-dashboards'
import { setupIdentityRestApi } from './identity/setup-identity-rest-api'
import { setupDrivesRestApi } from './drives/setup-drives-rest-api'
import { setupInstallRestApi } from './install/setup-install-rest-api'
import { setupDashboardsRestApi } from './dashboards/setup-dashboards-rest-api'
import { setupPatcher } from './patcher/setup-patcher'
import { setupMovies } from './movies/setup-movies'
import { setupMoviesRestApi } from './movies/setup-movies-api'

export const init = async (injector = rootInjector) => {
  const serviceLogger = getLogger(injector).withScope('service')
  await serviceLogger.information({ message: '🐀 Starting PI-RAT service...' })
  attachShutdownHandler(injector)
  /**
   * Set up stores and repositories
   */
  await serviceLogger.information({ message: '📦 Setting up stores and repositories...' })
  await Promise.all([
    await setupIdentity(injector),
    await setupDrives(injector),
    await setupInstall(injector),
    await setupDashboards(injector),
    await setupMovies(injector),
  ])

  /**
   * Execute patches
   */
  await setupPatcher(injector)

  /**
   * Setup REST APIs
   */
  await Promise.all([
    await setupIdentityRestApi(injector),
    await setupDrivesRestApi(injector),
    await setupInstallRestApi(injector),
    await setupDashboardsRestApi(injector),
    await setupMoviesRestApi(injector),
  ])

  await setupFrontendBundle(injector)
  return injector
}
