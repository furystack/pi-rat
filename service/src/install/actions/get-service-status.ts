import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { GetServiceStatusAction } from 'common'
import { ServiceStatusProvider } from '../service-installer'

export const GetServiceStatus: RequestAction<GetServiceStatusAction> = async ({ injector }) => {
  const state = await injector.getInstance(ServiceStatusProvider).getStatus()
  return JsonResult({
    state,
  })
}
