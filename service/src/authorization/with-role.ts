import { isAuthorized } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { AuthorizationResult } from '@furystack/repository'
import type { Roles } from 'common'

export const withRole =
  (...roles: Roles) =>
  async (options: { injector: Injector }): Promise<AuthorizationResult> => {
    const isAllowed = await isAuthorized(options.injector, ...roles)
    return isAllowed
      ? { isAllowed }
      : {
          isAllowed,
          message: 'You are not authorized :(',
        }
  }
