import type { FindOptions } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import type { LogEntry } from 'common'
import { LoggingApiClient } from './api-clients/logging-api-client.js'

@Injectable({ lifetime: 'singleton' })
export class LoggingService {
  @Injected(LoggingApiClient)
  declare private readonly loggingApiClient: LoggingApiClient

  public async getLogEntry(id: string) {
    const { result } = await this.loggingApiClient.call({
      method: 'GET',
      action: '/logs/:id',
      url: { id },
      query: {},
    })
    return result
  }

  public async findLogEntry(findOptions: FindOptions<LogEntry, Array<keyof LogEntry>>) {
    const { result } = await this.loggingApiClient.call({
      method: 'GET',
      action: '/logs',
      query: { findOptions },
    })
    return result
  }
}
