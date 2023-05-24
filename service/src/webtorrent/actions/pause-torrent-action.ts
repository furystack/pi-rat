import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { PauseTorrentEndpoint } from 'common'
import { TorrentClient } from '../torrent-client.js'

export const PauseTorrentAction: RequestAction<PauseTorrentEndpoint> = async ({ injector, getUrlParams }) => {
  const { id } = getUrlParams()
  const torrentClient = injector.getInstance(TorrentClient)
  await torrentClient.torrents.find((t) => t.infoHash === id)?.pause()

  return JsonResult({ success: true })
}
