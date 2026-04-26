import { defineService, type Token } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { IotApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

export interface IotApiClient {
  call: ReturnType<typeof createClient<IotApi>>
}

export const IotApiClient: Token<IotApiClient, 'singleton'> = defineService({
  name: 'pi-rat/IotApiClient',
  lifetime: 'singleton',
  factory: () => ({
    call: createClient<IotApi>({
      endpointUrl: `${environmentOptions.serviceUrl}/iot`,
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
