import { getStoreManager, type PhysicalStore } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import { AbstractLogger, type LeveledLogEntry } from '@furystack/logging'
import { LogEntry } from 'common'

@Injectable({ lifetime: 'singleton' })
export class DbLogger extends AbstractLogger {
  @Injected((injector) => getStoreManager(injector).getStoreFor(LogEntry, 'id'))
  declare private logEntryStore: PhysicalStore<LogEntry, 'id'>

  public async addEntry<T>(entry: LeveledLogEntry<T>): Promise<void> {
    await this.logEntryStore.add({
      id: crypto.randomUUID(),
      scope: entry.scope,
      message: entry.message,
      data: entry.data,
      level: entry.level,
      createdAt: new Date().toISOString(),
    })
  }
}
