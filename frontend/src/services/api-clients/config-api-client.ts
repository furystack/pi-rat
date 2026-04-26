import { defineService, type Token } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { ConfigApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

export interface ConfigApiClient {
  call: ReturnType<typeof createClient<ConfigApi>>
}

export const ConfigApiClient: Token<ConfigApiClient, 'singleton'> = defineService({
  name: 'pi-rat/ConfigApiClient',
  lifetime: 'singleton',
  factory: () => ({
    call: createClient<ConfigApi>({
      endpointUrl: `${environmentOptions.serviceUrl}/config`,
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
