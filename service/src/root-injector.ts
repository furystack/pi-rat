import { Injector } from '@furystack/inject'
import { useLogging, ConsoleLogger } from '@furystack/logging'

export const injector = new Injector()
useLogging(injector, ConsoleLogger)
