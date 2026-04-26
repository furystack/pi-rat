import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { SyncSubscribeAction, SyncUnsubscribeAction } from '@furystack/entity-sync-service'
import { useWebSocketApi } from '@furystack/websocket-api'
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

export const startPiRat = async (injector: Injector): Promise<void> => {
  const logger = getLogger(injector).withScope('service')
  await logger.information({ message: '🐀 Starting PI-RAT service...' })

  const appModelManager = injector.get(AppModelManager)

  await appModelManager.registerInternalAppModels(
    injector,
    LoggingAppModel,
    ConfigAppModel,
    IdentityAppModel,
    InstallAppModel,
    DrivesAppModel,
    DashboardsAppModel,
    MediaAppModel,
    IotAppModel,
    ChatAppModel,
    AiAppModel,
  )

  await useWebSocketApi({
    injector,
    port: getPort(),
    path: '/api/sync',
    actions: [SyncSubscribeAction, SyncUnsubscribeAction],
  })

  const wsService = await injector.getAsync(WebsocketService)
  await wsService.announce({ type: 'service-started' })

  await setupFrontendBundle(injector)

  await setupPatcher(injector)
}
