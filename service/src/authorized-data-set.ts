import { isAuthenticated } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { AuthorizationResult, DataSetSettings } from '@furystack/repository'

export const authorizedOnly = async (options: { injector: Injector }): Promise<AuthorizationResult> => {
  const isAllowed = await isAuthenticated(options.injector)
  return isAllowed
    ? { isAllowed }
    : {
        isAllowed,
        message: 'You are not authorized :(',
      }
}

export const authorizedDataSet: Partial<DataSetSettings<any, any>> = {
  authorizeAdd: authorizedOnly,
  authorizeGet: authorizedOnly,
  authorizeRemove: authorizedOnly,
  authorizeUpdate: authorizedOnly,
  authroizeRemoveEntity: authorizedOnly,
}
