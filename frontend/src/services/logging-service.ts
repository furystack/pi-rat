import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { LogEntry, WebsocketMessage } from 'common'
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

  private onMessage = ((messageData: WebsocketMessage) => {
    if (messageData.type === 'log-entry-added') {
      // Update the cache with the new log entry
      this.logEntryCache.setExplicitValue({
        loadArgs: [messageData.logEntry.id],
        value: { status: 'loaded', value: messageData.logEntry, updatedAt: new Date() },
      })

      // Invalidate query cache to ensure fresh results on next load
      this.logEntryQueryCache.flushAll()
    }
  }).bind(this)

  public init() {
    this.websocketNotificationsService.addListener('onMessage', this.onMessage)
  }

  public dispose() {
    this.websocketNotificationsService.removeListener('onMessage', this.onMessage)
  }
}
