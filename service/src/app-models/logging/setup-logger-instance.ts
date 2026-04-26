import type { Injector } from '@furystack/inject'
import { ConsoleLogger, useLogging, VerboseConsoleLogger } from '@furystack/logging'
import { DbLogger } from './db-logger.js'

export const setupLoggerInstance = async (_injector: Injector): Promise<void> => {
  // Re-register the logger collection with the DB logger added in.
  // useLogging always rebinds at the root injector and replaces any previous registration.
  useLogging(_injector, process.env.DEBUG ? VerboseConsoleLogger : ConsoleLogger, DbLogger)
}
