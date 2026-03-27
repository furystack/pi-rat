import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { GetServiceStatusAction } from 'common'
import { ExternalServiceStatusRegistry } from '../../../external-service-status-registry.js'
import { ServiceStatusProvider } from '../service-installer.js'

export const GetServiceStatus: RequestAction<GetServiceStatusAction> = async ({ injector }) => {
  const state = await injector.getInstance(ServiceStatusProvider).getStatus()

  const services = injector.getInstance(ExternalServiceStatusRegistry).getStatuses()

  return JsonResult({
    state,
    services: {
      omdb: services.omdb ?? false,
      tmdb: services.tmdb ?? false,
      github: services.github ?? false,
    },
  })
}
