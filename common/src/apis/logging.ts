import type { GetCollectionEndpoint, GetEntityEndpoint, RestApi } from '@furystack/rest'
import type { LogEntry } from '../models/index.js'

export interface LoggingApi extends RestApi {
  GET: {
    '/logs': GetCollectionEndpoint<LogEntry>
    '/logs/:id': GetEntityEndpoint<LogEntry, 'id'>
  }
}
