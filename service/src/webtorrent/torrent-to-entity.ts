import type { Torrent } from 'webtorrent'
import type { WebTorrentEntity } from 'common'
export const torrentToEntity = (torrent: Torrent): WebTorrentEntity => ({
  id: torrent.infoHash,
  name: torrent.name,
})
