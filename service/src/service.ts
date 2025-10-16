import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { EventHub } from '@furystack/utils'
import { setupAiRestApi } from './ai/setup-ai-rest-api.js'
import { setupAi } from './ai/setup-ai.js'
import { ChatAppModel } from './chat/index.js'
import { setupConfigRestApi } from './config/setup-config-rest-api.js'
import { setupConfig } from './config/setup-config.js'
import { setupDashboardsRestApi } from './dashboards/setup-dashboards-rest-api.js'
import { setupDashboards } from './dashboards/setup-dashboards.js'
import { setupDrivesRestApi } from './drives/setup-drives-rest-api.js'
import { setupDrives } from './drives/setup-drives.js'
import { setupIdentityRestApi } from './identity/setup-identity-rest-api.js'
import { setupIdentity } from './identity/setup-identity.js'
import { setupInstallRestApi } from './install/setup-install-rest-api.js'
import { setupInstall } from './install/setup-install.js'
import { setupIotApi } from './iot/setup-iot-api.js'
import { setupIot } from './iot/setup-iot.js'
import { setupMoviesRestApi } from './media/setup-media-api.js'
import { setupMovies } from './media/setup-media.js'
import { setupFrontendBundle } from './setup-frontend-bundle.js'
import { WebsocketService } from './websocket-service.js'

@Injectable({ lifetime: 'singleton' })
export class PiRatRootService extends EventHub<{ initialized: undefined }> {
  @Injected((injector) => getLogger(injector).withScope('service'))
  declare private logger: ScopedLogger

  public async init(injector: Injector) {
    await this.logger.information({ message: '🐀 Starting PI-RAT service...' })
    /**
     * Set up stores and repositories
     */
    await this.logger.information({ message: '📦 Setting up stores and repositories...' })
    await Promise.all([
      setupConfig(injector),
      setupIdentity(injector),
      setupDrives(injector),
      setupInstall(injector),
      setupDashboards(injector),
      setupMovies(injector),
      setupIot(injector),
      setupAi(injector),
    ])

    /**
     * Setup REST APIs
     */
    await Promise.all([
      setupConfigRestApi(injector),
      setupIdentityRestApi(injector),
      setupDrivesRestApi(injector),
      setupInstallRestApi(injector),
      setupDashboardsRestApi(injector),
      setupMoviesRestApi(injector),
      setupIotApi(injector),
      setupAiRestApi(injector),
    ])

    await injector.getInstance(ChatAppModel).register(injector)

    const wsService = injector.getInstance(WebsocketService)
    await wsService.announce({
      type: 'service-started',
    })

    await setupFrontendBundle(injector)

    this.emit('initialized', undefined)
  }
}
