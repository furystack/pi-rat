import type { Injector } from '@furystack/inject'
import {
  createCookieLoginStrategy,
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPasswordLoginAction,
  createPatchEndpoint,
  createPostEndpoint,
  GetCurrentUser,
  IsAuthenticated,
  LogoutAction,
  useRestService,
  Validate,
  type RequestAction,
} from '@furystack/rest-service'
import type { GetCurrentUserAction, IdentityApi, LoginAction as PiRatLoginAction } from 'common'
import identityApiSchema from 'common/schemas/identity-api.json' with { type: 'json' }
import { getCorsOptions } from '../../get-cors-options.js'
import { getPort } from '../../get-port.js'
import { PasswordResetAction } from './actions/password-reset-action.js'
import { RegisterAction } from './actions/register-action.js'
import { UserDataSet } from './setup-identity-store.js'

export const setupIdentityRestApi = async (injector: Injector) => {
  await useRestService<IdentityApi>({
    injector,
    root: 'api/identity',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/currentUser': Validate({ schema: identityApiSchema, schemaName: 'GetCurrentUserAction' })(
          GetCurrentUser as RequestAction<GetCurrentUserAction>,
        ),
        '/users': Validate({ schema: identityApiSchema, schemaName: 'GetCollectionEndpoint<User>' })(
          createGetCollectionEndpoint(UserDataSet),
        ),
        '/users/:id': Validate({ schema: identityApiSchema, schemaName: 'GetEntityEndpoint<User,"username">' })(
          createGetEntityEndpoint(UserDataSet),
        ),
        '/isAuthenticated': Validate({ schema: identityApiSchema, schemaName: 'IsAuthenticatedAction' })(
          IsAuthenticated,
        ),
      },
      POST: {
        '/login': Validate({ schema: identityApiSchema, schemaName: 'LoginAction' })(
          createPasswordLoginAction(createCookieLoginStrategy(injector)) as RequestAction<PiRatLoginAction>,
        ),
        '/logout': Validate({ schema: identityApiSchema, schemaName: 'LogoutAction' })(LogoutAction),
        '/register': Validate({ schema: identityApiSchema, schemaName: 'RegisterAction' })(RegisterAction),
        '/users': Validate({ schema: identityApiSchema, schemaName: 'PostUserEndpoint' })(
          createPostEndpoint(UserDataSet),
        ),
        '/password-reset': Validate({ schema: identityApiSchema, schemaName: 'PasswordResetAction' })(
          PasswordResetAction,
        ),
      },
      PATCH: {
        '/users/:id': Validate({
          schema: identityApiSchema,
          schemaName: 'PatchEndpoint<Omit<User,("createdAt"|"updatedAt")>,"username">',
        })(createPatchEndpoint(UserDataSet)),
      },
      DELETE: {
        '/users/:id': Validate({ schema: identityApiSchema, schemaName: 'DeleteEndpoint<User,"username">' })(
          createDeleteEndpoint(UserDataSet),
        ),
      },
    },
  })
}
