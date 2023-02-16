import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import WebTorrent from 'webtorrent'
import { SetupWebTorrentRestApi } from './setup-webtorrent-rest-api'

export const setupWebTorrent = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('WebTorrent')
  await logger.information({ message: '💞  Setting up WebTorrent...' })

  await logger.verbose({ message: 'Setting up Torrent client...' })
  const t = new WebTorrent({})
  injector.setExplicitInstance(t)

  await logger.verbose({ message: 'Setting up REST API...' })

  await SetupWebTorrentRestApi(injector)

  await logger.information({ message: '💞  WebTorrent is ready!' })
}
