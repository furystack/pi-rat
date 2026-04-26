import { defineService, type Token } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { MediaApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

export interface MediaApiClient {
  call: ReturnType<typeof createClient<MediaApi>>
}

export const MediaApiClient: Token<MediaApiClient, 'singleton'> = defineService({
  name: 'pi-rat/MediaApiClient',
  lifetime: 'singleton',
  factory: () => ({
    call: createClient<MediaApi>({
      endpointUrl: `${environmentOptions.serviceUrl}/media`,
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
