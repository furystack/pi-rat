import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { SyncSubscribeAction, SyncUnsubscribeAction } from '@furystack/entity-sync-service'
import { useWebsockets } from '@furystack/websocket-api'
import { EventHub } from '@furystack/utils'
import { AiAppModel } from './ai/ai-app-model.js'
import { ChatAppModel } from './app-models/chat/chat-app-model.js'
import { ConfigAppModel } from './app-models/config/config-app-model.js'
import { DashboardsAppModel } from './app-models/dashboards/dashboard-app-model.js'
import { DrivesAppModel } from './app-models/drives/drives-app-model.js'
import { IdentityAppModel } from './app-models/identity/identity-app-model.js'
import { InstallAppModel } from './app-models/install/install-app-model.js'
import { IotAppModel } from './app-models/iot/iot-app-model.js'
import { LoggingAppModel } from './app-models/logging/logging-app-model.js'
import { MediaAppModel } from './app-models/media/media-app-model.js'
import { AppModelManager } from './AppModelManager.js'
import { getPort } from './get-port.js'
import { setupPatcher } from './patcher/setup-patcher.js'
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
      injector.getInstance(LoggingAppModel),
      injector.getInstance(ConfigAppModel),
      injector.getInstance(IdentityAppModel),
      injector.getInstance(InstallAppModel),
      injector.getInstance(DrivesAppModel),
      injector.getInstance(DashboardsAppModel),
      injector.getInstance(MediaAppModel),
      injector.getInstance(IotAppModel),
      injector.getInstance(ChatAppModel),
      injector.getInstance(AiAppModel),
    )

    const syncInjector = injector.createChild({ owner: 'entity-sync' })
    await useWebsockets(syncInjector, {
      port: getPort(),
      path: '/api/sync',
      actions: [SyncSubscribeAction, SyncUnsubscribeAction],
    })

    const wsService = injector.getInstance(WebsocketService)
    await wsService.announce({
      type: 'service-started',
    })

    await setupFrontendBundle(injector)

    await setupPatcher(injector)

    this.emit('initialized', undefined)
  }
}
