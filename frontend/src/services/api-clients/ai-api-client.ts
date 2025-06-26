import { Injectable } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { AiApi } from 'common'
import { environmentOptions } from '../../environment-options.js'

@Injectable({ lifetime: 'singleton' })
export class AiApiClient {
  public call = createClient<AiApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/ai`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
