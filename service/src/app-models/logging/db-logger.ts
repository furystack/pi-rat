import { useSystemIdentityContext } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import { createLogger, type Logger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import type { LogEntry as PiRatLogEntry } from 'common'
import { LogEntryDataSet } from './setup-logging-storage.js'

export const DbLogger: Token<Logger, 'singleton'> = defineService({
  name: 'pi-rat/DbLogger',
  lifetime: 'singleton',
  factory: ({ injector, onDispose }) => {
    const systemInjector = useSystemIdentityContext({ injector, username: 'db-logger' })
    onDispose(() => systemInjector[Symbol.asyncDispose]())

    return createLogger(async (entry) => {
      const logEntry: PiRatLogEntry = {
        id: crypto.randomUUID(),
        scope: entry.scope,
        message: entry.message,
        data: entry.data,
        level: entry.level,
        createdAt: new Date().toISOString(),
      }
      await getDataSetFor(systemInjector, LogEntryDataSet).add(systemInjector, logEntry)
    })
  },
})
