import { defineService, type Token } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { ChatApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

export interface ChatApiClient {
  call: ReturnType<typeof createClient<ChatApi>>
}

export const ChatApiClient: Token<ChatApiClient, 'singleton'> = defineService({
  name: 'pi-rat/ChatApiClient',
  lifetime: 'singleton',
  factory: () => ({
    call: createClient<ChatApi>({
      endpointUrl: `${environmentOptions.serviceUrl}/chat`,
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
