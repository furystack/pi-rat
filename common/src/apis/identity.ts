import type { User } from '@furystack/core'
import type { RestApi } from '@furystack/rest'

export type IsAuthenticatedAction = { result: { isAuthenticated: boolean } }
export type GetCurrentUserAction = { result: User }

export type LoginAction = { result: User; body: { username: string; password: string } }
export type LogoutAction = { result: unknown }

export interface IdentityApi extends RestApi {
  GET: {
    '/isAuthenticated': IsAuthenticatedAction
    '/currentUser': GetCurrentUserAction
  }
  POST: {
    '/login': LoginAction
    '/logout': LogoutAction
  }
}
