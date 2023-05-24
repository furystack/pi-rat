import { createClient } from '@furystack/rest-client-fetch'
import type { TorrentApi } from 'common'
import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../../environment-options.js'

@Injectable({ lifetime: 'singleton' })
export class TorrentsApiClient {
  public call = createClient<TorrentApi>({
    endpointUrl: `${environmentOptions.serviceUrl}/torrent`,
    requestInit: {
      credentials: 'include',
      mode: 'cors',
    },
  })
}
