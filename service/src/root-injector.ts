import { Injector } from '@furystack/inject'
import { useLogging, ConsoleLogger, VerboseConsoleLogger } from '@furystack/logging'
import { attachShutdownHandler } from './shutdown-handler.js'

export const injector = new Injector()
attachShutdownHandler(injector)
useLogging(injector, process.env.DEBUG ? VerboseConsoleLogger : ConsoleLogger)
