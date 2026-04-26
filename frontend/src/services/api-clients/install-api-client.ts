import { defineService, type Token } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { InstallApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

export interface InstallApiClient {
  call: ReturnType<typeof createClient<InstallApi>>
}

export const InstallApiClient: Token<InstallApiClient, 'singleton'> = defineService({
  name: 'pi-rat/InstallApiClient',
  lifetime: 'singleton',
  factory: () => ({
    call: createClient<InstallApi>({
      endpointUrl: `${environmentOptions.serviceUrl}/install`,
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
