import { createClient } from '@furystack/rest-client-fetch'
import type { DashboardsApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../environment-options'

@Injectable({ lifetime: 'singleton' })
export class DashboardsApiClient {
  public call = createClient<DashboardsApi>({
    endpointUrl: `${environmentOptions.serviceUrl}`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
