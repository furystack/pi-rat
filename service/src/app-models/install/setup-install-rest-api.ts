import type { Injector } from '@furystack/inject'
import '@furystack/repository'
import { useRestService, Validate } from '@furystack/rest-service'
import type { InstallApi } from 'common'
import installApiSchema from 'common/schemas/install-api.json' with { type: 'json' }

import { getCorsOptions } from '../../get-cors-options.js'
import { getPort } from '../../get-port.js'
import { GetAppModels } from './actions/get-app-models.js'
import { GetServiceStatus } from './actions/get-service-status.js'
import { PostInstallAction } from './actions/post-install-action.js'

// AppModelManifest's Record<string, string[]> generates additionalProperties
// as an object in JSON Schema, which is valid but incompatible with the
// Validate type's narrower boolean-only additionalProperties definition.
const schema = installApiSchema as unknown as {
  definitions: Record<string, { required?: string[]; additionalProperties?: boolean; [key: string]: unknown }>
}

export const setupInstallRestApi = async (injector: Injector) => {
  await useRestService<InstallApi>({
    injector,
    root: 'api/install',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/serviceStatus': Validate({ schema, schemaName: 'GetServiceStatusAction' })(GetServiceStatus),
        '/app-models': Validate({ schema, schemaName: 'GetAppModelsAction' })(GetAppModels),
      },
      POST: {
        '/install': Validate({ schema, schemaName: 'InstallAction' })(PostInstallAction),
      },
    },
  })
}
