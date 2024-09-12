import { Injector } from '@furystack/inject'
import { ConsoleLogger, useLogging, VerboseConsoleLogger } from '@furystack/logging'
import { attachShutdownHandler } from './shutdown-handler.js'

export const injector = new Injector()
useLogging(injector, process.env.DEBUG ? VerboseConsoleLogger : ConsoleLogger)
void attachShutdownHandler(injector)
