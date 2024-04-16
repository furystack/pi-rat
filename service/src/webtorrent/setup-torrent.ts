import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { TorrentClient } from './torrent-client.js'
import { Config } from 'common'
import { getStoreManager } from '@furystack/core'

export const setupTorrent = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Torrent')

  await logger.verbose({ message: '🎥  Setting up Torrents...' })

  const client = injector.getInstance(TorrentClient)

  const configStore = getStoreManager(injector).getStoreFor(Config, 'id')
  configStore.subscribe('onEntityAdded', ({ entity }) => entity.id === 'TORRENT_CONFIG' && client.init(injector))
  configStore.subscribe('onEntityUpdated', ({ change }) => change.id === 'TORRENT_CONFIG' && client.init(injector))
  configStore.subscribe('onEntityRemoved', ({ key }) => key === 'TORRENT_CONFIG' && client.init(injector))
}
