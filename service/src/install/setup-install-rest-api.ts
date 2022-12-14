import type { InstallApi } from 'common'
import { installApiSchema } from 'common'
import { useRestService, Validate } from '@furystack/rest-service'
import '@furystack/repository'
import { GetServiceStatus } from './actions/get-service-status'
import { getLogger } from '@furystack/logging'
import type { Injector } from '@furystack/inject'
import { getPort } from '../get-port'
import { getCorsOptions } from '../get-cors-options'
import { PostInstallAction } from './actions/post-install-action'

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
