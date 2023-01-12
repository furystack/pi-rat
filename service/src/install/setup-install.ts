import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { setupInstallRestApi } from './setup-install-rest-api'

export const setupInstall = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Install')
  logger.information({ message: '💾  Setting up Install...' })

  await logger.verbose({ message: 'Setting up REST API...' })
  await setupInstallRestApi(injector)

  logger.information({ message: '✅  Install setup completed' })
}
