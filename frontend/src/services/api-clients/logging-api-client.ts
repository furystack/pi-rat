import { defineService, type Token } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { LoggingApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

export interface LoggingApiClient {
  call: ReturnType<typeof createClient<LoggingApi>>
}

export const LoggingApiClient: Token<LoggingApiClient, 'singleton'> = defineService({
  name: 'pi-rat/LoggingApiClient',
  lifetime: 'singleton',
  factory: () => ({
    call: createClient<LoggingApi>({
      endpointUrl: `${environmentOptions.serviceUrl}/logging`,
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
