import '@furystack/repository'
import { getLogger } from '@furystack/logging'
import { injector as rootInjector } from './root-injector.js'
import { attachShutdownHandler } from './shutdown-handler.js'
import { setupDrives } from './drives/setup-drives.js'
import { setupIdentity } from './identity/setup-identity.js'
import { setupFrontendBundle } from './setup-frontend-bundle.js'
import { setupInstall } from './install/setup-install.js'
import { setupDashboards } from './dashboards/setup-dashboards.js'
import { setupIdentityRestApi } from './identity/setup-identity-rest-api.js'
import { setupDrivesRestApi } from './drives/setup-drives-rest-api.js'
import { setupInstallRestApi } from './install/setup-install-rest-api.js'
import { setupDashboardsRestApi } from './dashboards/setup-dashboards-rest-api.js'
import { setupPatcher } from './patcher/setup-patcher.js'
import { setupMovies } from './media/setup-media.js'
import { setupMoviesRestApi } from './media/setup-media-api.js'
import { setupConfig } from './config/setup-config.js'
import { setupConfigRestApi } from './config/setup-config-rest-api.js'
import { setupTorrentApi } from './webtorrent/setup-torrent-api.js'
import { setupTorrent } from './webtorrent/setup-torrent.js'

export const init = async (injector = rootInjector) => {
  const serviceLogger = getLogger(injector).withScope('service')
  await serviceLogger.information({ message: '🐀 Starting PI-RAT service...' })
  attachShutdownHandler(injector)
  /**
   * Set up stores and repositories
   */
  await serviceLogger.information({ message: '📦 Setting up stores and repositories...' })
  await Promise.all([
    await setupConfig(injector),
    await setupIdentity(injector),
    await setupDrives(injector),
    await setupInstall(injector),
    await setupDashboards(injector),
    await setupMovies(injector),
    await setupTorrent(injector),
  ])

  /**
   * Execute patches
   */
  await setupPatcher(injector)

  /**
   * Setup REST APIs
   */
  await Promise.all([
    await setupConfigRestApi(injector),
    await setupIdentityRestApi(injector),
    await setupDrivesRestApi(injector),
    await setupInstallRestApi(injector),
    await setupDashboardsRestApi(injector),
    await setupMoviesRestApi(injector),
    await setupTorrentApi(injector),
  ])

  await setupFrontendBundle(injector)
  return injector
}
