import type { User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { SessionService } from '../services/session.js'

export class SessionUserUnavailableError extends Error {
  constructor() {
    super('No authenticated user available')
    this.name = 'SessionUserUnavailableError'
  }
}

/**
 * Returns the current user synchronously from the session.
 * Intended for use in components rendered within authenticated routes.
 * @throws {SessionUserUnavailableError} if no user is available
 */
export const getUser = (injector: Injector): User => {
  const user = injector.get(SessionService).currentUser.getValue()
  if (!user) {
    throw new SessionUserUnavailableError()
  }
  return user
}

/**
 * Checks if the current user has the specified role.
 * @throws {SessionUserUnavailableError} if no user is available
 */
export const hasRole = (injector: Injector, role: string): boolean => {
  return getUser(injector).roles.includes(role)
}
