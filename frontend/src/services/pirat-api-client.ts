import { createClient } from '@furystack/rest-client-fetch'
import { PiratApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../environment-options'

@Injectable({ lifetime: 'singleton' })
export class PiratApiClient {
  public call = createClient<PiratApi>({
    endpointUrl: environmentOptions.serviceUrl,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
