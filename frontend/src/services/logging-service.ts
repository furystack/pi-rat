import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { LogEntry } from 'common'
import { LoggingApiClient } from './api-clients/logging-api-client.js'
import { WebsocketNotificationsService } from './websocket-events.js'

@Injectable({ lifetime: 'singleton' })
export class LoggingService {
  @Injected(WebsocketNotificationsService)
  declare readonly websocketNotificationsService: WebsocketNotificationsService

  @Injected(LoggingApiClient)
  declare private readonly loggingApiClient: LoggingApiClient

  private logEntryCache = new Cache({
    capacity: 100,
    load: async (id: string) => {
      const { result } = await this.loggingApiClient.call({
        method: 'GET',
        action: '/logs/:id',
        url: { id },
        query: {},
      })
      return result
    },
  })

  private logEntryQueryCache = new Cache({
    capacity: 100,
    load: async (findOptions: FindOptions<LogEntry, Array<keyof LogEntry>>) => {
      const { result } = await this.loggingApiClient.call({
        method: 'GET',
        action: '/logs',
        query: {
          findOptions,
        },
      })

      result.entries.forEach((entry) => {
        this.logEntryCache.setExplicitValue({
          loadArgs: [entry.id],
          value: { status: 'loaded', value: entry, updatedAt: new Date() },
        })
      })

      return result
    },
  })

  public getLogEntry = this.logEntryCache.get.bind(this.logEntryCache)
  public getLogEntryAsObservable = this.logEntryCache.getObservable.bind(this.logEntryCache)

  public findLogEntry = this.logEntryQueryCache.get.bind(this.logEntryQueryCache)
  public findLogEntryAsObservable = this.logEntryQueryCache.getObservable.bind(this.logEntryQueryCache)

  public init() {
    // TODO: PUSH when adding a new log entry?
  }
}
