import type { Injector } from '@furystack/inject'
import {
  GetCurrentUser,
  IsAuthenticated,
  LoginAction,
  LogoutAction,
  useRestService,
  Validate,
} from '@furystack/rest-service'
import type { IdentityApi } from 'common'
import { getCorsOptions } from '../get-cors-options'
import { getPort } from '../get-port'
import { identityApiSchema } from 'common'

export const setupIdentityRestApi = async (injector: Injector) => {
  await useRestService<IdentityApi>({
    injector,
    root: 'api/identity',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/currentUser': Validate({ schema: identityApiSchema, schemaName: 'GetCurrentUserAction' })(GetCurrentUser),
        '/isAuthenticated': IsAuthenticated,
      },
      POST: {
        '/login': LoginAction,
        '/logout': LogoutAction,
      },
    },
  })
}
