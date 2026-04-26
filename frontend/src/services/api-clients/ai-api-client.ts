import { defineService, type Token } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { AiApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

export interface AiApiClient {
  call: ReturnType<typeof createClient<AiApi>>
}

export const AiApiClient: Token<AiApiClient, 'singleton'> = defineService({
  name: 'pi-rat/AiApiClient',
  lifetime: 'singleton',
  factory: () => ({
    call: createClient<AiApi>({
      endpointUrl: `${environmentOptions.serviceUrl}/ai`,
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
