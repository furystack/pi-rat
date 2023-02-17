import type { Injector } from '@furystack/inject'
import { createGetCollectionEndpoint, createGetEntityEndpoint, useRestService } from '@furystack/rest-service'
import type { WebTorrentApi } from 'common'
import { WebTorrentEntity } from 'common'
import { getCorsOptions } from '../get-cors-options'
import { getPort } from '../get-port'

export const SetupWebTorrentRestApi = async (injector: Injector) => {
  useRestService<WebTorrentApi>({
    injector,
    root: 'api/webtorrent',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/torrents': createGetCollectionEndpoint({
          model: WebTorrentEntity,
          primaryKey: 'id',
        }),
        '/torrents/:id': createGetEntityEndpoint({
          model: WebTorrentEntity,
          primaryKey: 'id',
        }),
      },
      POST: {
        '/torrents': null as any,
        '/torrents/:id/start': null as any,
        '/torrents/:id/stop': null as any,
      },
    },
  })
}
