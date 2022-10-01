import { createClient } from '@furystack/rest-client-fetch'
import type { IdentityApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../environment-options'

@Injectable({ lifetime: 'singleton' })
export class IdentityApiClient {
  public call = createClient<IdentityApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/identity`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
