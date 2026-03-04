import { isAuthorized, useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { EventHub, PathHelper } from '@furystack/utils'
import type { FSWatcher } from 'chokidar'
import { watch } from 'chokidar'
import type { PiRatFile } from 'common'
import { Drive } from 'common'
import { sep } from 'path'
import { WebsocketService } from '../../websocket-service.js'

type EventParam = PiRatFile

@Injectable({ lifetime: 'singleton' })
export class FileWatcherService extends EventHub<{
  add: EventParam
  addDir: EventParam
  change: EventParam
  unlink: EventParam
  unlinkDir: EventParam
  all: EventParam
  ready: EventParam
  raw: EventParam
  error: EventParam & { errorMessage: string; error: unknown }
}> {
  private watchers: { [key: string]: FSWatcher } = {}

  @Injected((injector) => getLogger(injector).withScope('FileWatchers'))
  declare private logger: ScopedLogger

  @Injected(WebsocketService)
  declare private webSocketService: WebsocketService

  private addWatcher = async (drive: Drive) => {
    if (this.watchers[drive.letter]) {
      throw new Error(`Watcher for drive '${drive.letter}' already exists`)
    }

    await this.logger.verbose({ message: `🔍  Starting File Watcher on volume '${drive.letter}'...` })
    const watcher = watch(drive.physicalPath, { ignoreInitial: true })

    watcher.on('error', (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error)
      void this.logger.error({ message: `Error watching volume '${drive.letter}': ${errorMessage}`, data: { error } })
      this.emit('error', { path: '', driveLetter: drive.letter, errorMessage, error })

      void this.webSocketService.announce(
        { type: 'file-change', event: 'error', path: '', drive: drive.letter },
        ({ injector }) => isAuthorized(injector, 'admin'),
      )
    })

    watcher.on('all', (event, path) => {
      const relativePath = PathHelper.normalize(path.toString().replace(drive.physicalPath, '').replaceAll(sep, '/'))
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
      await this.logger.warning({ message: `Attempted to remove watcher for drive '${letter}', but no watcher exists` })
    }
  }

  declare private injector: Injector

  @Injected((injector) => getDataSetFor(injector, Drive, 'letter'))
  declare private driveDataSet: DataSet<Drive, 'letter'>

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'file-watcher' }))
  declare private systemInjector: Injector

  public init() {
    void this.startWatchCurrentDirectories().catch((error) => {
      void this.logger.error({ message: 'Failed to initialize file watchers', data: { error } })
    })
  }

  private async startWatchCurrentDirectories() {
    this.driveDataSet.subscribe('onEntityAdded', ({ entity }) => void this.addWatcher(entity))
    this.driveDataSet.subscribe('onEntityRemoved', ({ key }) => void this.removeWatcher(key))
    const allDrives = await this.driveDataSet.find(this.systemInjector, {})
    allDrives.forEach((drive) => void this.addWatcher(drive))
  }
}

export const useFileWatchers = async (injector: Injector) => {
  injector.getInstance(FileWatcherService)
}
