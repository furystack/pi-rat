import { Injector } from '@furystack/inject'
import { useLogging, VerboseConsoleLogger } from '@furystack/logging'

export const injector = new Injector()
useLogging(injector, VerboseConsoleLogger)
