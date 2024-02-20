import type { RequestAction } from '@furystack/rest-service'
import { AuthorizationError, isAuthorized } from '@furystack/core'
import { JsonResult } from '@furystack/rest-service'
import type { AwakeEndpoint } from 'common'

export const AwakeAction: RequestAction<AwakeEndpoint> = async ({ injector }) => {
  if (!isAuthorized(injector, 'admin')) {
    throw new AuthorizationError('Needs admin access')
  }
  // TODO: Implement action
  return JsonResult({ success: true })
}
