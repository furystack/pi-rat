import { createClient } from '@furystack/rest-client-fetch'
import type { ConfigApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../environment-options'

@Injectable({ lifetime: 'singleton' })
export class ConfigApiClient {
  public call = createClient<ConfigApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/config`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
