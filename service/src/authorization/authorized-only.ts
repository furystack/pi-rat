import { isAuthenticated } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { AuthorizationResult } from '@furystack/repository'

export const authorizedOnly = async (options: { injector: Injector }): Promise<AuthorizationResult> => {
  const isAllowed = await isAuthenticated(options.injector)
  return isAllowed
    ? { isAllowed }
    : {
        isAllowed,
        message: 'You are not authorized :(',
      }
}
