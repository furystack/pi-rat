import type { Injector } from '@furystack/inject'
import { createGetCollectionEndpoint, createGetEntityEndpoint, useRestService, Validate } from '@furystack/rest-service'
import { LogEntry, type LoggingApi } from 'common'
import loggingApiSchema from 'common/schemas/logging-api.json' with { type: 'json' }
import { getCorsOptions } from '../../get-cors-options.js'
import { getPort } from '../../get-port.js'

export const setupLoggingRestApi = async (injector: Injector) => {
  await useRestService<LoggingApi>({
    injector,
    port: getPort(),
    cors: getCorsOptions(),
    root: 'api/logging',
    api: {
      GET: {
        '/logs': Validate({ schema: loggingApiSchema, schemaName: 'GetCollectionEndpoint<LogEntry>' })(
          createGetCollectionEndpoint({ model: LogEntry, primaryKey: 'id' }),
        ),
        '/logs/:id': Validate({ schema: loggingApiSchema, schemaName: 'GetEntityEndpoint<LogEntry,"id">' })(
          createGetEntityEndpoint({ model: LogEntry, primaryKey: 'id' }),
        ),
      },
    },
  })
}
