import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { GetServiceStatusAction } from 'common'
import { ServiceStatusProvider } from '../service-installer.js'
import { OmdbClientService } from '../../media/metadata-services/omdb-client-service.js'

export const GetServiceStatus: RequestAction<GetServiceStatusAction> = async ({ injector }) => {
  const state = await injector.getInstance(ServiceStatusProvider).getStatus()

  const omdb = !!injector.getInstance(OmdbClientService).config

  return JsonResult({
    state,
    services: {
      omdb,
      github: false,
    },
  })
}
