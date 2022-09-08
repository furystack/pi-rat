import { JsonResult, RequestAction } from '@furystack/rest-service'
import { ServiceStatus } from 'common'
import { ServiceStatusProvider } from '../service-installer'

export const GetServiceStatusAction: RequestAction<{ result: { state: ServiceStatus } }> = async ({ injector }) => {
  const state = await injector.getInstance(ServiceStatusProvider).getStatus()
  return JsonResult({
    state,
  })
}
