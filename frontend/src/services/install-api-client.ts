import { createClient } from '@furystack/rest-client-fetch'
import type { InstallApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../environment-options'

@Injectable({ lifetime: 'singleton' })
export class InstallApiClient {
  public call = createClient<InstallApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/install`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
