import { Injectable } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { ChatApi } from 'common'
import { environmentOptions } from '../../environment-options.js'

@Injectable({ lifetime: 'singleton' })
export class ChatApiClient {
  public call = createClient<ChatApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/chat`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
