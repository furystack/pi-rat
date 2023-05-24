import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { DeleteTorrentEndpoint } from 'common'
import { TorrentClient } from '../torrent-client.js'

export const DeleteTorrentAction: RequestAction<DeleteTorrentEndpoint> = async ({
  injector,
  getQuery,
  getUrlParams,
}) => {
  const { id } = getUrlParams()
  const { deleteFiles } = getQuery()
  const torrentClient = injector.getInstance(TorrentClient)
  await torrentClient.remove(id, { destroyStore: deleteFiles })

  return JsonResult({ success: true })
}
