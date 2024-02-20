import { createClient } from '@furystack/rest-client-fetch'
import type { IotApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../../environment-options.js'

@Injectable({ lifetime: 'singleton' })
export class IotApiClient {
  public call = createClient<IotApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/iot`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
