import type { AuthorizationResult } from '@furystack/repository'

export const alwaysDeny = async (): Promise<AuthorizationResult> => {
  return {
    isAllowed: false,
    message: 'You are not authorized :(',
  }
}
