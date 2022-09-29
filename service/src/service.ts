import '@furystack/repository'
import { injector } from './root-injector'
import { attachShutdownHandler } from './shutdown-handler'
import { getLogger } from '@furystack/logging'
import { setupDrives } from './setup-drives'
import { setupIdentity } from './setup-identity'
import { setupRestApi } from './setup-rest-api'
import { setupFrontendBundle } from './setup-frontend-bundle'

const init = async () => {
  const serviceLogger = getLogger(injector).withScope('service')
  serviceLogger.information({ message: '🐀 Starting PI-RAT service...' })
  attachShutdownHandler(injector)
  await Promise.all([await setupIdentity(injector), await setupDrives(injector), await setupRestApi(injector)])
  await setupFrontendBundle(injector)
}

init().catch((err) => {
  console.error('Error during service initialization', err)
  process.exit(1)
})
