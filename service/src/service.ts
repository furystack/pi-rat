import { getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { SequelizeStore } from '@furystack/sequelize-store'
import { EventHub } from '@furystack/utils'
import { useWebsockets } from '@furystack/websocket-api'
import { User } from 'common'
import { setupAiRestApi } from './ai/setup-ai-rest-api.js'
import { setupAi } from './ai/setup-ai.js'
import { setupChatRestApi } from './chat/setup-chat-api.js'
import { setupChat } from './chat/setup-chat.js'
import { setupConfigRestApi } from './config/setup-config-rest-api.js'
import { setupConfig } from './config/setup-config.js'
import { setupDashboardsRestApi } from './dashboards/setup-dashboards-rest-api.js'
import { setupDashboards } from './dashboards/setup-dashboards.js'
import { setupDrivesRestApi } from './drives/setup-drives-rest-api.js'
import { setupDrives } from './drives/setup-drives.js'
import { getPort } from './get-port.js'
import { setupIdentityRestApi } from './identity/setup-identity-rest-api.js'
import { setupIdentity } from './identity/setup-identity.js'
import { setupInstallRestApi } from './install/setup-install-rest-api.js'
import { setupInstall } from './install/setup-install.js'
import { setupIotApi } from './iot/setup-iot-api.js'
import { setupIot } from './iot/setup-iot.js'
import { setupMoviesRestApi } from './media/setup-media-api.js'
import { setupMovies } from './media/setup-media.js'
import { setupPatcher } from './patcher/setup-patcher.js'
import { setupFrontendBundle } from './setup-frontend-bundle.js'

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
      await setupConfig(injector),
      await setupIdentity(injector),
      await setupDrives(injector),
      await setupInstall(injector),
      await setupDashboards(injector),
      await setupMovies(injector),
      await setupIot(injector),
      await setupChat(injector),
      await setupAi(injector),
    ])

    await this.logger.information({ message: '🔄 Syncing models...' })
    const store = getStoreManager(injector).getStoreFor(User, 'username')
    if (store instanceof SequelizeStore) {
      const model = await store.getModel()
      if (model.sequelize) {
        await model.sequelize.sync({
          alter: true,
        })
      }
    }

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
      await setupChatRestApi(injector),
      await setupAiRestApi(injector),
    ])

    useWebsockets(injector, {
      port: getPort(),
      path: '/api/ws',
    })

    await setupFrontendBundle(injector)

    this.emit('initialized', undefined)
  }
}
