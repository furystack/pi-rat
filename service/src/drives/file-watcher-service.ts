import { isAuthorized, StoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { EventHub } from '@furystack/utils'
import type { FSWatcher } from 'chokidar'
import { watch } from 'chokidar'
import type { PiRatFile } from 'common'
import { Drive } from 'common'
import { sep } from 'path'
import { WebsocketService } from '../websocket-service.js'

type EventParam = PiRatFile

@Injectable({ lifetime: 'singleton' })
export class FileWatcherService extends EventHub<{
  add: EventParam
  addDir: EventParam
  change: EventParam
  unlink: EventParam
  unlinkDir: EventParam
}> {
  private watchers: { [key: string]: FSWatcher } = {}

  @Injected((injector) => getLogger(injector).withScope('FileWatchers'))
  private declare logger: ScopedLogger

  @Injected(WebsocketService)
  private declare webSocketService: WebsocketService

  private addWatcher = async (drive: Drive) => {
    if (this.watchers[drive.letter]) {
      throw new Error(`Watcher for drive '${drive.letter}' already exists`)
    }

    await this.logger.verbose({ message: `🔍  Starting File Watcher on volume '${drive.letter}'...` })
    const watcher = watch(drive.physicalPath, { ignoreInitial: true })
    watcher.on('all', (event, path) => {
      const relativePath = (path as string).toString().replace(drive.physicalPath, '').replaceAll(sep, '/')
      void this.logger.verbose({ message: `📁  Event '${event}' in volume '${drive.letter}': ${relativePath}` })
      this.emit(event, { path: relativePath, driveLetter: drive.letter })

      void this.webSocketService.announce(
        { type: 'file-change', event, path: relativePath, drive: drive.letter },
        ({ injector }) => isAuthorized(injector, 'admin'),
      )
    })

    this.watchers[drive.letter] = watcher
  }

  private removeWatcher = async (letter: string) => {
    if (this.watchers[letter]) {
      await this.watchers[letter].close()
      delete this.watchers[letter]
      await this.logger.information({ message: `🔍  Stopping File Watcher on volume '${letter}'...` })
    } else {
      throw new Error(`Watcher for drive '${letter}' does not exist`)
    }
  }

  private declare injector: Injector

  public async init() {
    await this.startWatchCurrentDirectories()
  }

  private async startWatchCurrentDirectories() {
    const driveStore = this.injector.getInstance(StoreManager).getStoreFor(Drive, 'letter')
    driveStore.subscribe('onEntityAdded', ({ entity }) => void this.addWatcher(entity))
    driveStore.subscribe('onEntityRemoved', ({ key }) => void this.removeWatcher(key))
    const allDrives = await driveStore.find({})
    allDrives.forEach((drive) => void this.addWatcher(drive))
  }
}

export const useFileWatchers = async (injector: Injector) => {
  injector.getInstance(FileWatcherService)
}
