import { Injector } from '@furystack/inject'
import { useLogging, ConsoleLogger, VerboseConsoleLogger } from '@furystack/logging'

export const injector = new Injector()
useLogging(injector, process.env.DEBUG ? VerboseConsoleLogger : ConsoleLogger)
