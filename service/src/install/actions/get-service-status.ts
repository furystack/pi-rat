import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { GetServiceStatusAction } from 'common'
import { ServiceStatusProvider } from '../service-installer.js'
import { OmdbClientService } from '../../media/metadata-services/omdb-client-service.js'
import { TorrentClient } from '../../webtorrent/torrent-client.js'

export const GetServiceStatus: RequestAction<GetServiceStatusAction> = async ({ injector }) => {
  const state = await injector.getInstance(ServiceStatusProvider).getStatus()

  const omdb = !!injector.getInstance(OmdbClientService).config
  const torrent = !!injector.getInstance(TorrentClient).getConfig()

  return JsonResult({
    state,
    services: {
      omdb,
      torrent,
      github: false,
    },
  })
}
