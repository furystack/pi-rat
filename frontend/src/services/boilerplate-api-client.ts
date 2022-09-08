import { createClient } from '@furystack/rest-client-fetch'
import { BoilerplateApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../environment-options'

@Injectable({ lifetime: 'singleton' })
export class BoilerplateApiClient {
  public call = createClient<BoilerplateApi>({
    endpointUrl: environmentOptions.serviceUrl,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
