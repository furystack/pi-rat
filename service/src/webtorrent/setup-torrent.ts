import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { TorrentClient } from './torrent-client.js'

export const setupTorrent = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Torrent')

  await logger.verbose({ message: '🎥  Setting up Torrents...' })

  const client = new TorrentClient({
    tracker: true,
  })

  ;(client as any).torrentsPath = ''

  injector.setExplicitInstance(client, TorrentClient)

  await client.init()
}
