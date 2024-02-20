import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { setupIotApi } from './setup-iot-api.js'
import { setupIotStore } from './setup-store.js'

export const setupIot = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('IOT')
  await logger.verbose({ message: '☁️  Setting up IOT...' })

  await logger.verbose({ message: '☁️  Setting up IOT store and repository...' })
  await setupIotStore(injector, logger)

  await logger.verbose({ message: '☁️  Setting up IOT REST and WebSocket API...' })
  await setupIotApi(injector)

  await logger.verbose({ message: '✅  IOT setup complete' })
}
