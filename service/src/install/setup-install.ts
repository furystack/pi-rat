import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'

export const setupInstall = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Install')
  logger.verbose({ message: '💾  Setting up Install store and repository...' })

  logger.verbose({ message: '✅  Install setup completed' })
}
