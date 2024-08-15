import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { DeviceAvailabilityHub } from './device-availability-hub.js'
import { setupIotStore } from './setup-store.js'

export const setupIot = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('IOT')
  await logger.verbose({ message: '☁️  Setting up IOT...' })

  await logger.verbose({ message: '☁️  Setting up IOT store and repository...' })
  await setupIotStore(injector, logger)

  await logger.verbose({ message: '☁️  Setting up IOT device availability hub...' })
  injector.getInstance(DeviceAvailabilityHub)

  await logger.verbose({ message: '✅  IOT setup complete' })
}
