import { defineService, type Token } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { IdentityApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

export interface IdentityApiClient {
  call: ReturnType<typeof createClient<IdentityApi>>
}

export const IdentityApiClient: Token<IdentityApiClient, 'singleton'> = defineService({
  name: 'pi-rat/IdentityApiClient',
  lifetime: 'singleton',
  factory: () => ({
    call: createClient<IdentityApi>({
      endpointUrl: `${environmentOptions.serviceUrl}/identity`,
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
