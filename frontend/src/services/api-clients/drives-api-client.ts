import { defineService, type Token } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { DrivesApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

export interface DrivesApiClient {
  call: ReturnType<typeof createClient<DrivesApi>>
}

export const DrivesApiClient: Token<DrivesApiClient, 'singleton'> = defineService({
  name: 'pi-rat/DrivesApiClient',
  lifetime: 'singleton',
  factory: () => ({
    call: createClient<DrivesApi>({
      endpointUrl: `${environmentOptions.serviceUrl}/drives`,
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
