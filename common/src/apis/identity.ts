import type { WithOptionalId } from '@furystack/core'
import type { DeleteEndpoint, GetCollectionEndpoint, GetEntityEndpoint, PatchEndpoint, RestApi } from '@furystack/rest'
import type { Roles, User } from '../models/identity/user.js'

type FurystackUser = { username: string; roles: Roles }

export type IsAuthenticatedAction = { result: { isAuthenticated: boolean } }
export type GetCurrentUserAction = { result: FurystackUser }

export type LoginAction = { result: FurystackUser; body: { username: string; password: string } }
export type LogoutAction = { result: unknown }

export type PostUserEndpoint = { result: User; body: WithOptionalId<FurystackUser, 'username'> }

export interface IdentityApi extends RestApi {
  GET: {
    '/isAuthenticated': IsAuthenticatedAction
    '/currentUser': GetCurrentUserAction
    '/users': GetCollectionEndpoint<User>
    '/users/:id': GetEntityEndpoint<User, 'username'>
  }
  POST: {
    '/login': LoginAction
    '/logout': LogoutAction
    '/users': PostUserEndpoint
  }
  PATCH: {
    '/users/:id': PatchEndpoint<Omit<User, 'createdAt' | 'updatedAt'>, 'username'>
  }
  DELETE: {
    '/users/:id': DeleteEndpoint<User, 'username'>
  }
}
