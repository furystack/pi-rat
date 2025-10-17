import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { DbLogger } from './db-logger.js'

export const setupLoggerInstance = async (injector: Injector) => {
  const logger = getLogger(injector)
  const dbLogger = injector.getInstance(DbLogger)
  logger.attachLogger(dbLogger)
}
