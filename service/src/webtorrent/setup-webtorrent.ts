import type { Injector } from '@furystack/inject'
import { addStore, InMemoryStore } from '@furystack/core'
import { getLogger } from '@furystack/logging'
import WebTorrent from 'webtorrent'
import { WebTorrentEntity } from 'common'
import { SetupWebTorrentRestApi } from './setup-webtorrent-rest-api'
import { getRepository } from '@furystack/repository'
import { withRole } from '../with-role'

export const setupWebTorrent = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('WebTorrent')
  await logger.information({ message: '💞  Setting up WebTorrent...' })

  await logger.verbose({ message: 'Setting up Torrent client...' })
  const t = new WebTorrent({})
  injector.setExplicitInstance(t)

  addStore(
    injector,
    new InMemoryStore({
      model: WebTorrentEntity,
      primaryKey: 'id',
    }),
  )

  getRepository(injector).createDataSet(WebTorrentEntity, 'id', {
    authorizeAdd: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeRemove: withRole('admin'),
    authorizeUpdate: withRole('admin'),
  })

  await logger.verbose({ message: 'Setting up REST API...' })

  await SetupWebTorrentRestApi(injector)

  await logger.information({ message: '💞  WebTorrent is ready!' })
}
