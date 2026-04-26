import type { Injector } from '@furystack/inject'
import {
  Validate,
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
  type RequestAction,
} from '@furystack/rest-service'
import type { ConfigApi } from 'common'
import configApiSchema from 'common/schemas/config-api.json' with { type: 'json' }
import { getCorsOptions } from '../../get-cors-options.js'
import { getPort } from '../../get-port.js'
import { ConfigDataSet } from './setup-config-store.js'

type PostConfigEndpointType = ConfigApi['POST']['/config']

export const setupConfigRestApi = async (injector: Injector) => {
  await useRestService<ConfigApi>({
    injector,
    root: 'api/config',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/config': Validate({
          schema: configApiSchema,
          schemaName: 'GetCollectionEndpoint<Config>',
        })(createGetCollectionEndpoint(ConfigDataSet)),
        '/config/:id': Validate({
          schema: configApiSchema,
          schemaName: 'GetEntityEndpoint<Config,"id">',
        })(createGetEntityEndpoint(ConfigDataSet)),
      },
      POST: {
        '/config': Validate({
          schema: configApiSchema,
          schemaName: 'PostConfigEndpoint',
        })(createPostEndpoint(ConfigDataSet) as RequestAction<PostConfigEndpointType>),
      },
      PATCH: {
        '/config/:id': Validate({
          schema: configApiSchema,
          schemaName: 'PatchConfigEndpoint',
        })(createPatchEndpoint(ConfigDataSet)),
      },
      DELETE: {
        '/config/:id': Validate({
          schema: configApiSchema,
          schemaName: 'DeleteEndpoint<Config,"id">',
        })(createDeleteEndpoint(ConfigDataSet)),
      },
    },
  })
}
