import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
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
import { setupIot } from './iot/setup-iot.js'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import { setupIotApi } from './iot/setup-iot-api.js'
import { EventHub } from '@furystack/utils'

@Injectable({ lifetime: 'singleton' })
export class PiRatRootService extends EventHub<{ initialized: undefined }> {
  @Injected((injector) => getLogger(injector).withScope('service'))
  private declare logger: ScopedLogger

  public async init(injector: Injector) {
    await this.logger.information({ message: '🐀 Starting PI-RAT service...' })
    /**
     * Set up stores and repositories
     */
    await this.logger.information({ message: '📦 Setting up stores and repositories...' })
    await Promise.all([
      await setupConfig(injector),
      await setupIdentity(injector),
      await setupDrives(injector),
      await setupInstall(injector),
      await setupDashboards(injector),
      await setupMovies(injector),
      await setupIot(injector),
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
      await setupIotApi(injector),
    ])

    await setupFrontendBundle(injector)

    this.emit('initialized', undefined)
  }
}
