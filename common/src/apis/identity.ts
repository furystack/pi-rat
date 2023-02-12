import type { User } from '@furystack/core'
import type { DeleteEndpoint, GetCollectionEndpoint, GetEntityEndpoint, PatchEndpoint, RestApi } from '@furystack/rest'

export type IsAuthenticatedAction = { result: { isAuthenticated: boolean } }
export type GetCurrentUserAction = { result: User }

export type LoginAction = { result: User; body: { username: string; password: string } }
export type LogoutAction = { result: unknown }

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
  }
  PATCH: {
    '/users/:id': PatchEndpoint<User, 'username'>
  }
  DELETE: {
    '/users/:id': DeleteEndpoint<User, 'username'>
  }
}
