import type { InstallApi } from 'common'
import installApiSchema from 'common/schemas/install-api.json' with { type: 'json' }
import { useRestService, Validate } from '@furystack/rest-service'
import '@furystack/repository'
import { getLogger } from '@furystack/logging'
import type { Injector } from '@furystack/inject'

import { GetServiceStatus } from './actions/get-service-status.js'
import { getPort } from '../get-port.js'
import { getCorsOptions } from '../get-cors-options.js'
import { PostInstallAction } from './actions/post-install-action.js'

export const setupInstallRestApi = async (injector: Injector) => {
  const restApiLogger = getLogger(injector).withScope('service')

  restApiLogger.information({ message: '⚙️  Starting REST API...' })

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
