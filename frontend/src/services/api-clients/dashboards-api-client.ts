import { defineService, type Token } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { DashboardsApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

export interface DashboardsApiClient {
  call: ReturnType<typeof createClient<DashboardsApi>>
}

export const DashboardsApiClient: Token<DashboardsApiClient, 'singleton'> = defineService({
  name: 'pi-rat/DashboardsApiClient',
  lifetime: 'singleton',
  factory: () => ({
    call: createClient<DashboardsApi>({
      endpointUrl: `${environmentOptions.serviceUrl}/dashboards`,
      requestInit: {
        credentials: 'include',
        mode: 'cors',
      },
      onResponseParseError: ({ response, error }) => {
        console.error(`Failed to parse response from ${response.url}:`, error)
      },
    }),
  }),
})
