import type { FindOptions } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import type { LogEntry } from 'common'
import { LoggingApiClient } from './api-clients/logging-api-client.js'

export interface LoggingService {
  getLogEntry(id: string): Promise<LogEntry>
  findLogEntry(
    findOptions: FindOptions<LogEntry, Array<keyof LogEntry>>,
  ): Promise<{ entries: LogEntry[]; count: number }>
}

export const LoggingService: Token<LoggingService, 'singleton'> = defineService({
  name: 'pi-rat/LoggingService',
  lifetime: 'singleton',
  factory: ({ inject }) => {
    const loggingApiClient = inject(LoggingApiClient)
    return {
      getLogEntry: async (id) => {
        const { result } = await loggingApiClient.call({
          method: 'GET',
          action: '/logs/:id',
          url: { id },
          query: {},
        })
        return result
      },
      findLogEntry: async (findOptions) => {
        const { result } = await loggingApiClient.call({
          method: 'GET',
          action: '/logs',
          query: { findOptions },
        })
        return result
      },
    }
  },
})
