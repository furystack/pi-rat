import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import '@furystack/repository'
import { useRestService, Validate } from '@furystack/rest-service'
import type { InstallApi } from 'common'
import installApiSchema from 'common/schemas/install-api.json' with { type: 'json' }

import { getCorsOptions } from '../get-cors-options.js'
import { getPort } from '../get-port.js'
import { GetServiceStatus } from './actions/get-service-status.js'
import { PostInstallAction } from './actions/post-install-action.js'

export const setupInstallRestApi = async (injector: Injector) => {
  const restApiLogger = getLogger(injector).withScope('service')

  await restApiLogger.information({ message: '⚙️  Starting REST API...' })

  await useRestService<InstallApi>({
    injector,
    root: 'api/install',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/serviceStatus': Validate({ schema: installApiSchema, schemaName: 'GetServiceStatusAction' })(
          GetServiceStatus,
        ),
      },
      POST: {
        '/install': Validate({ schema: installApiSchema, schemaName: 'InstallAction' })(PostInstallAction),
      },
    },
  })
}
