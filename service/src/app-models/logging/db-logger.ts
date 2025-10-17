import { getStoreManager, isAuthorized, type PhysicalStore } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import { AbstractLogger, type LeveledLogEntry } from '@furystack/logging'
import { LogEntry } from 'common'
import { WebsocketService } from '../../websocket-service.js'

@Injectable({ lifetime: 'singleton' })
export class DbLogger extends AbstractLogger {
  @Injected((injector) => getStoreManager(injector).getStoreFor(LogEntry, 'id'))
  declare private logEntryStore: PhysicalStore<LogEntry, 'id'>

  @Injected(WebsocketService)
  declare private websocketService: WebsocketService

  public async addEntry<T>(entry: LeveledLogEntry<T>): Promise<void> {
    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      scope: entry.scope,
      message: entry.message,
      data: entry.data,
      level: entry.level,
      createdAt: new Date().toISOString(),
    }

    void this.logEntryStore.add(logEntry)

    // Broadcast the new log entry to admin users only
    void this.websocketService.announce(
      {
        type: 'log-entry-added',
        logEntry,
      },
      async ({ injector }) => {
        return await isAuthorized(injector, 'admin')
      },
    )
  }
}
