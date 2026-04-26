import { createInjector } from '@furystack/inject'
import { ConsoleLogger, useLogging, VerboseConsoleLogger } from '@furystack/logging'
import { attachShutdownHandler } from './shutdown-handler.js'

export const injector = createInjector()
useLogging(injector, process.env.DEBUG ? VerboseConsoleLogger : ConsoleLogger)
void attachShutdownHandler(injector)
