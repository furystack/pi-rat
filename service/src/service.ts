import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { EventHub } from '@furystack/utils'
import { setupAiRestApi } from './ai/setup-ai-rest-api.js'
import { setupAi } from './ai/setup-ai.js'
import { AppModelManager } from './AppModelManager.js'
import { ChatAppModel } from './chat/chat-app-model.js'
import { ConfigAppModel } from './config/config-app-model.js'
import { DashboardsAppModel } from './dashboards/dashboard-app-model.js'
import { DrivesAppModel } from './drives/drives-app-model.js'
import { IdentityAppModel } from './identity/identity-app-model.js'
import { InstallAppModel } from './install/install-app-model.js'
import { setupIotApi } from './iot/setup-iot-api.js'
import { setupIot } from './iot/setup-iot.js'
import { MediaAppModel } from './media/media-app-model.js'
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
      injector.getInstance(InstallAppModel),
      injector.getInstance(DrivesAppModel),
      injector.getInstance(DashboardsAppModel),
      injector.getInstance(MediaAppModel),
      injector.getInstance(ChatAppModel),
    )

    /**
     * Set up stores and repositories
     */
    await this.logger.information({ message: '📦 Setting up stores and repositories...' })
    await Promise.all([setupIot(injector), setupAi(injector)])

    /**
     * Setup REST APIs
     */
    await Promise.all([setupIotApi(injector), setupAiRestApi(injector)])

    const wsService = injector.getInstance(WebsocketService)
    await wsService.announce({
      type: 'service-started',
    })

    await setupFrontendBundle(injector)

    this.emit('initialized', undefined)
  }
}
