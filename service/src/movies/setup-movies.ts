import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'

export const setupMovies = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Movies')

  logger.verbose({ message: '🍿  Setting up Movies store and repository...' })

  logger.verbose({ message: '✅  Movies setup completed' })
}
