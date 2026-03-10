import { createClient } from '@furystack/rest-client-fetch'
import type { DashboardsApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../../utils/environment-options.js'

@Injectable({ lifetime: 'singleton' })
export class DashboardsApiClient {
  public call = createClient<DashboardsApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/dashboards`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
    onResponseParseError: ({ response, error }) => {
      console.error(`Failed to parse response from ${response.url}:`, error)
    },
  })
}
