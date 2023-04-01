import { createClient } from '@furystack/rest-client-fetch'
import type { MediaApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../environment-options'

@Injectable({ lifetime: 'singleton' })
export class MediaApiClient {
  public call = createClient<MediaApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/media`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
