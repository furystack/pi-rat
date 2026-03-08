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

// TODO(@furystack/rest-service): Validate's type expects additionalProperties as
// `boolean`, but ts-json-schema-generator emits `{ "type": "object" }` for
// Record<string, string[]> in AppModelManifest. Both are valid JSON Schema; the
// mismatch is in the library's type definition, not the runtime behavior.
// Remove this cast once Validate accepts full JSON Schema additionalProperties.
const schema = installApiSchema as unknown as Parameters<typeof Validate>[0]['schema']

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
