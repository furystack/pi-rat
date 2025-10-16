import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { EventHub } from '@furystack/utils'
import { setupAiRestApi } from './ai/setup-ai-rest-api.js'
import { setupAi } from './ai/setup-ai.js'
import { AppModelManager } from './AppModelManager.js'
import { ChatAppModel } from './chat/index.js'
import { ConfigAppModel } from './config/index.js'
import { setupDashboardsRestApi } from './dashboards/setup-dashboards-rest-api.js'
import { setupDashboards } from './dashboards/setup-dashboards.js'
import { DrivesAppModel } from './drives/index.js'
import { IdentityAppModel } from './identity/index.js'
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

    const appModelManager = injector.getInstance(AppModelManager)

    await appModelManager.registerInternalAppModels(
      injector.getInstance(ConfigAppModel),
      injector.getInstance(IdentityAppModel),
      injector.getInstance(DrivesAppModel),
      injector.getInstance(ChatAppModel),
    )

    /**
     * Set up stores and repositories
     */
    await this.logger.information({ message: '📦 Setting up stores and repositories...' })
    await Promise.all([
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
      setupInstallRestApi(injector),
      setupDashboardsRestApi(injector),
      setupMoviesRestApi(injector),
      setupIotApi(injector),
      setupAiRestApi(injector),
    ])

    const wsService = injector.getInstance(WebsocketService)
    await wsService.announce({
      type: 'service-started',
    })

    await setupFrontendBundle(injector)

    this.emit('initialized', undefined)
  }
}
