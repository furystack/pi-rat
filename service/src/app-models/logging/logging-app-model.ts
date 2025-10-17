import { Injectable, type Injector } from '@furystack/inject'
import type { InternalAppModel } from '../../AppModelManager.js'
import { LoggingManifest } from './logging-manifest.js'
import { setupLoggerInstance } from './setup-logger-instance.js'
import { setupLoggingRestApi } from './setup-logging-rest-api.js'
import { setupLoggingStorage } from './setup-logging-storage.js'

@Injectable({ lifetime: 'singleton' })
export class LoggingAppModel implements InternalAppModel {
  declare private injector: Injector

  public manifest = LoggingManifest

  public state = {
    type: 'initializing' as const,
  }

  public async setup() {
    await Promise.all([
      setupLoggingStorage(this.injector),
      setupLoggerInstance(this.injector),
      setupLoggingRestApi(this.injector),
    ])
  }
}
