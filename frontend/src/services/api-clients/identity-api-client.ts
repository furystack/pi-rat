import { createClient } from '@furystack/rest-client-fetch'
import type { IdentityApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../../utils/environment-options.js'

@Injectable({ lifetime: 'singleton' })
export class IdentityApiClient {
  public call = createClient<IdentityApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/identity`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
    onResponseParseError: ({ response, error }) => {
      console.error(`Failed to parse response from ${response.url}:`, error)
    },
  })
}
