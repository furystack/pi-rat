import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import { AbstractLogger, type LeveledLogEntry } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { LogEntry } from 'common'

@Injectable({ lifetime: 'singleton' })
export class DbLogger extends AbstractLogger {
  @Injected((injector) => getDataSetFor(injector, LogEntry, 'id'))
  declare private logEntryDataSet: DataSet<LogEntry, 'id'>

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'db-logger' }))
  declare private systemInjector: Injector

  public async addEntry<T>(entry: LeveledLogEntry<T>): Promise<void> {
    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      scope: entry.scope,
      message: entry.message,
      data: entry.data,
      level: entry.level,
      createdAt: new Date().toISOString(),
    }

    void this.logEntryDataSet.add(this.systemInjector, logEntry)
  }
}
