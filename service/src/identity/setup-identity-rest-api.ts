import type { Injector } from '@furystack/inject'
import {
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  GetCurrentUser,
  IsAuthenticated,
  LoginAction,
  LogoutAction,
  useRestService,
  Validate,
  type RequestAction,
} from '@furystack/rest-service'
import type { GetCurrentUserAction, IdentityApi, LoginAction as PiRatLoginAction } from 'common'
import { User } from 'common'
import identityApiSchema from 'common/schemas/identity-api.json' with { type: 'json' }
import { getCorsOptions } from '../get-cors-options.js'
import { getPort } from '../get-port.js'

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
          createGetCollectionEndpoint({
            model: User,
            primaryKey: 'username',
          }),
        ),
        '/users/:id': Validate({ schema: identityApiSchema, schemaName: 'GetEntityEndpoint<User,"username">' })(
          createGetEntityEndpoint({
            model: User,
            primaryKey: 'username',
          }),
        ),
        '/isAuthenticated': IsAuthenticated,
      },
      POST: {
        '/login': LoginAction as RequestAction<PiRatLoginAction>,
        '/logout': LogoutAction,
        '/users': Validate({ schema: identityApiSchema, schemaName: 'PostUserEndpoint' })(
          createPostEndpoint({
            model: User,
            primaryKey: 'username',
          }),
        ),
      },
      PATCH: {
        '/users/:id': Validate({
          schema: identityApiSchema,
          schemaName: 'PatchEndpoint<Omit<User,("createdAt"|"updatedAt")>,"username">',
        })(
          createPatchEndpoint({
            model: User,
            primaryKey: 'username',
          }),
        ),
      },
      DELETE: {
        '/users/:id': Validate({ schema: identityApiSchema, schemaName: 'DeleteEndpoint<User,"username">' })(
          createDeleteEndpoint({
            model: User,
            primaryKey: 'username',
          }),
        ),
      },
    },
  })
}
