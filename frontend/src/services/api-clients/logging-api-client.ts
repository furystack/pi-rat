import { Injectable } from '@furystack/inject'
import { createClient } from '@furystack/rest-client-fetch'
import type { LoggingApi } from 'common'
import { environmentOptions } from '../../utils/environment-options.js'

@Injectable({ lifetime: 'singleton' })
export class LoggingApiClient {
  public call = createClient<LoggingApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/logging`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
    onResponseParseError: ({ response, error }) => {
      console.error(`Failed to parse response from ${response.url}:`, error)
    },
  })
}
