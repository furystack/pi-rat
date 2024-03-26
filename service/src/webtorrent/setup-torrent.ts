import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { TorrentClient } from './torrent-client.js'
import { getDataSetFor } from '@furystack/repository'
import { Config } from 'common'

export const setupTorrent = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Torrent')

  await logger.verbose({ message: '🎥  Setting up Torrents...' })

  const client = injector.getInstance(TorrentClient)

  injector.setExplicitInstance(client, TorrentClient)
  await client.init(injector)
  const configDataSet = getDataSetFor(injector, Config, 'id')
  configDataSet.subscribe('onEntityAdded', ({ entity }) => entity.id === 'TORRENT_CONFIG' && client.init(injector))
  configDataSet.subscribe('onEntityUpdated', ({ change }) => change.id === 'TORRENT_CONFIG' && client.init(injector))
  configDataSet.subscribe('onEntityRemoved', ({ key }) => key === 'TORRENT_CONFIG' && client.init(injector))
}
