import { isAuthorized, StoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { Drive } from 'common'
import type { FSWatcher } from 'chokidar'
import { watch } from 'chokidar'
import { useWebsockets, WebSocketApi } from '@furystack/websocket-api'
import { getPort } from '../get-port.js'
import { sep } from 'path'
import { onAdd, onUnlink, onUnlinkDir } from '../media/actions/movie-file-maintainer.js'

export const useFileWatchers = async (injector: Injector) => {
  const watchers: { [key: string]: FSWatcher } = {}
  const logger = getLogger(injector).withScope('FileWatchers')

  useWebsockets(injector, {
    port: getPort(),
    path: '/api/ws',
  })

  const addWatcher = async (drive: Drive) => {
    logger.verbose({ message: `🔍  Starting File Watcher on volume '${drive.letter}'...` })
    const watcher = watch(drive.physicalPath, { ignoreInitial: true })
    watcher.on('all', (event, path) => {
      const relativePath = path.toString().replace(drive.physicalPath, '').replaceAll(sep, '/')
      logger.verbose({ message: `📁  Event '${event}' in volume '${drive.letter}': ${relativePath}` })
      injector.getInstance(WebSocketApi).broadcast(async (options) => {
        if (await isAuthorized(options.injector, 'admin')) {
          options.ws.send(JSON.stringify({ type: 'file-change', event, path: relativePath, drive: drive.letter }))
        }
      })
    })

    const movieMaintainerUnlinkHandler = onUnlink(injector)
    watcher.on('unlink', (path) => {
      const relativePath = path.toString().replace(drive.physicalPath, '').replaceAll(sep, '/')
      movieMaintainerUnlinkHandler(drive, relativePath)
    })

    const movieMaintainerUnlinkDirHandler = onUnlinkDir(injector)
    watcher.on('unlinkDir', (path) => {
      const relativePath = path.toString().replace(drive.physicalPath, '').replaceAll(sep, '/')
      movieMaintainerUnlinkDirHandler(drive, relativePath)
    })

    const movieMaintainerOnAddHandler = onAdd(injector)

    watcher.on('add', (path) => {
      const relativePath = path.toString().replace(drive.physicalPath, '').replaceAll(sep, '/')
      movieMaintainerOnAddHandler(drive, relativePath)
    })

    watchers[drive.letter] = watcher
  }

  const removeWatcher = (letter: string) => {
    if (watchers[letter]) {
      watchers[letter].close()
      delete watchers[letter]
      logger.information({ message: `🔍  Stopping File Watcher on volume '${letter}'...` })
    }
  }

  const driveStore = injector.getInstance(StoreManager).getStoreFor(Drive, 'letter')
  const dataSet = getDataSetFor(injector, Drive, 'letter')
  dataSet.subscribe('onEntityAdded', ({ entity }) => addWatcher(entity))
  dataSet.subscribe('onEntityRemoved', ({ key }) => removeWatcher(key))
  const allDrives = await driveStore.find({})
  allDrives.forEach((drive) => addWatcher(drive))
}
