import type { Injector } from '@furystack/inject'
import { JsonResult, useRestService } from '@furystack/rest-service'
import type { TorrentApi } from 'common'
import { getPort } from '../get-port.js'
import { getCorsOptions } from '../get-cors-options.js'
import { TorrentClient } from './torrent-client.js'
import { PostTorrentAction } from './actions/post-torrent-action.js'
import { DeleteTorrentAction } from './actions/delete-torrent-action.js'
import { PauseTorrentAction } from './actions/pause-torrent-action.js'
import { ResumeTorrentAction } from './actions/resume-torrent-action.js'

export const setupTorrentApi = async (injector: Injector) => {
  await useRestService<TorrentApi>({
    injector,
    root: 'api/torrent',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/torrents': async ({ injector: i }) => {
          const torrentClient = i.getInstance(TorrentClient)
          return JsonResult(torrentClient.torrents.map(torrentClient.toApiTorrent))
        },
      },
      POST: {
        '/torrents': PostTorrentAction,
        '/torrents/:id/pause': PauseTorrentAction,
        '/torrents/:id/resume': ResumeTorrentAction,
      },
      DELETE: {
        '/torrents/:id': DeleteTorrentAction,
      },
    },
  })
}
