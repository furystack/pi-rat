import { getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import type { SequelizeStore } from '@furystack/sequelize-store'
import { EventHub } from '@furystack/utils'
import { User } from 'common'
import { AiAppModel } from './ai/ai-app-model.js'
import { ChatAppModel } from './app-models/chat/chat-app-model.js'
import { IotAppModel } from './app-models/iot/iot-app-model.js'
import { MediaAppModel } from './app-models/media/media-app-model.js'
import { AppModelManager } from './AppModelManager.js'
import { ConfigAppModel } from './config/config-app-model.js'
import { DashboardsAppModel } from './dashboards/dashboard-app-model.js'
import { DrivesAppModel } from './drives/drives-app-model.js'
import { IdentityAppModel } from './identity/identity-app-model.js'
import { InstallAppModel } from './install/install-app-model.js'
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

    const wsService = injector.getInstance(WebsocketService)
    await wsService.announce({
      type: 'service-started',
    })

    const userStore = getStoreManager(injector).getStoreFor(User, 'username') as unknown as SequelizeStore<
      User,
      any,
      'username',
      User
    >
    await userStore.sequelizeModel.sequelize?.sync()

    await setupFrontendBundle(injector)

    await setupPatcher(injector)

    this.emit('initialized', undefined)
  }
}
