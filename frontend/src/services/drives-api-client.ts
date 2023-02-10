import { createClient } from '@furystack/rest-client-fetch'
import type { DrivesApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../environment-options'

@Injectable({ lifetime: 'singleton' })
export class DrivesApiClient {
  public call = createClient<DrivesApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/drives`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
