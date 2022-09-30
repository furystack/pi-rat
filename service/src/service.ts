import '@furystack/repository'
import { injector } from './root-injector'
import { attachShutdownHandler } from './shutdown-handler'
import { getLogger } from '@furystack/logging'
import { setupDrives } from './drives/setup-drives'
import { setupIdentity } from './identity/setup-identity'
import { setupFrontendBundle } from './setup-frontend-bundle'
import { setupInstall } from './install/setup-install'

const init = async () => {
  const serviceLogger = getLogger(injector).withScope('service')
  serviceLogger.information({ message: '🐀 Starting PI-RAT service...' })
  attachShutdownHandler(injector)
  await Promise.all([await setupIdentity(injector), await setupDrives(injector), await setupInstall(injector)])
  await setupFrontendBundle(injector)
}

init().catch((err) => {
  console.error('Error during service initialization', err)
  process.exit(1)
})
