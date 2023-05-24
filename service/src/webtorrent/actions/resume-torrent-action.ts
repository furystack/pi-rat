import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { ResumeTorrentEndpoint } from 'common'
import { TorrentClient } from '../torrent-client.js'

export const ResumeTorrentAction: RequestAction<ResumeTorrentEndpoint> = async ({ getUrlParams, injector }) => {
  const { id } = getUrlParams()
  const torrentClient = injector.getInstance(TorrentClient)
  await torrentClient.torrents.find((t) => t.infoHash === id)?.resume()

  return JsonResult({ success: true })
}
