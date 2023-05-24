import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { TorrentClient } from './torrent-client.js'
import { getDataSetFor } from '@furystack/repository'
import { Config } from 'common'

export const setupTorrent = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Torrent')

  await logger.verbose({ message: '🎥  Setting up Torrents...' })

  const client = new TorrentClient({
    tracker: true,
  })

  injector.setExplicitInstance(client, TorrentClient)
  await client.init(injector)
  const configDataSet = getDataSetFor(injector, Config, 'id')
  configDataSet.onEntityAdded.subscribe(({ entity }) => entity.type === 'TORRENT_CONFIG' && client.init(injector))
  configDataSet.onEntityUpdated.subscribe(({ change }) => change.type === 'TORRENT_CONFIG' && client.init(injector))
}
