import type { Injector } from '@furystack/inject'
import {
  Authorize,
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  GetCurrentUser,
  IsAuthenticated,
  LoginAction,
  LogoutAction,
  useRestService,
  Validate,
} from '@furystack/rest-service'
import { IdentityApi, User } from 'common'
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
        '/users': Authorize('admin')(
          Validate({ schema: identityApiSchema, schemaName: 'GetCollectionEndpoint<User>' })(
            createGetCollectionEndpoint({
              model: User,
              primaryKey: 'username',
            }),
          ),
        ),
        '/users/:id': Authorize('admin')(
          Validate({ schema: identityApiSchema, schemaName: 'GetEntityEndpoint<User,"username">' })(
            createGetEntityEndpoint({
              model: User,
              primaryKey: 'username',
            }),
          ),
        ),
        '/isAuthenticated': IsAuthenticated,
      },
      POST: {
        '/login': LoginAction,
        '/logout': LogoutAction,
      },
      PATCH: {
        '/users/:id': Authorize('admin')(
          Validate({ schema: identityApiSchema, schemaName: 'PatchEndpoint<User,"username">' })(
            createPatchEndpoint({
              model: User,
              primaryKey: 'username',
            }),
          ),
        ),
      },
      DELETE: {
        '/users/:id': Authorize('admin')(
          Validate({ schema: identityApiSchema, schemaName: 'DeleteEndpoint<User,"username">' })(
            createDeleteEndpoint({
              model: User,
              primaryKey: 'username',
            }),
          ),
        ),
      },
    },
  })
}
