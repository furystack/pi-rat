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
import configApiSchema from 'common/schemas/config-api.json'
import { Config } from 'common'
import { getCorsOptions } from '../get-cors-options'
import { getPort } from '../get-port'
import type { Injector } from '@furystack/inject'

export const setupConfigRestApi = async (injector: Injector) => {
  useRestService<ConfigApi>({
    injector,
    root: 'api/config',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/config': Validate({
          schema: configApiSchema,
          schemaName: 'GetCollectionEndpoint<Config>',
        })(createGetCollectionEndpoint({ model: Config, primaryKey: 'id' })),
        '/config/:id': Validate({
          schema: configApiSchema,
          schemaName: 'GetEntityEndpoint<Config,"id">',
        })(createGetEntityEndpoint({ model: Config, primaryKey: 'id' })),
      },
      POST: {
        '/config': Validate({
          schema: configApiSchema,
          schemaName: 'PostEndpoint<Config,"id",Omit<WithOptionalId<Config,("createdAt"|"updatedAt")>,"id">>',
        })(createPostEndpoint({ model: Config, primaryKey: 'id' })),
      },
      PATCH: {
        '/config/:id': Validate({
          schema: configApiSchema,
          schemaName: 'PatchEndpoint<Config,"id">',
        })(createPatchEndpoint({ model: Config, primaryKey: 'id' })),
      },
      DELETE: {
        '/config/:id': Validate({
          schema: configApiSchema,
          schemaName: 'DeleteEndpoint<Config,"id">',
        })(createDeleteEndpoint({ model: Config, primaryKey: 'id' })),
      },
    },
  })
}
