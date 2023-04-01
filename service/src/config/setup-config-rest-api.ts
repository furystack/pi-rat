import {
  Validate,
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
} from '@furystack/rest-service'
import type { ConfigApi } from 'common'
import { configApiSchema } from 'common'
import { Config } from 'common'
import { getCorsOptions } from '../get-cors-options'
import { getPort } from '../get-port'
import type { Injector } from '@furystack/inject'

type t = typeof configApiSchema

export const setupConfigRestApi = async (injector: Injector) => {
  useRestService<ConfigApi>({
    injector,
    root: 'api/media',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/config': Validate<t>({
          schema: configApiSchema,
          schemaName: 'GetEntityEndpoint<Config,"id">',
        })(createGetCollectionEndpoint({ model: Config, primaryKey: 'id' })),
        '/config/:id': createGetEntityEndpoint({ model: Config, primaryKey: 'id' }),
      },
      POST: {
        '/config': createPostEndpoint({ model: Config, primaryKey: 'id' }),
      },
      PATCH: {
        '/config/:id': createPatchEndpoint({ model: Config, primaryKey: 'id' }),
      },
      DELETE: {
        '/config/:id': createDeleteEndpoint({ model: Config, primaryKey: 'id' }),
      },
    },
  })
}
