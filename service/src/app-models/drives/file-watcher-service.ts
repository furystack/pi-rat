import { isAuthorized, useSystemIdentityContext } from '@furystack/core'
import { defineService, type Injector, type Token } from '@furystack/inject'
import { useScopedLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { EventHub, PathHelper } from '@furystack/utils'
import type { FSWatcher } from 'chokidar'
import { watch } from 'chokidar'
import type { Drive, PiRatFile } from 'common'
import { sep } from 'path'
import { WebsocketService } from '../../websocket-service.js'
import { DriveDataSet } from './setup-drives.js'

type FileWatcherEvents = {
  add: PiRatFile
  addDir: PiRatFile
  change: PiRatFile
  unlink: PiRatFile
  unlinkDir: PiRatFile
  all: PiRatFile
  ready: PiRatFile
  raw: PiRatFile
  error: PiRatFile & { errorMessage: string; error: unknown }
}

export interface FileWatcherService extends EventHub<FileWatcherEvents> {
  init(): void
}

class FileWatcherServiceImpl extends EventHub<FileWatcherEvents> {
  private watchers: Record<string, FSWatcher> = {}

  constructor(
    private readonly logger: ReturnType<typeof useScopedLogger>,
    private readonly systemInjector: Injector,
    private readonly getWebsocketService: () => Promise<WebsocketService>,
  ) {
    super()
  }

  private addWatcher = async (drive: Drive) => {
    if (this.watchers[drive.letter]) {
      throw new Error(`Watcher for drive '${drive.letter}' already exists`)
    }

    await this.logger.verbose({ message: `🔍  Starting File Watcher on volume '${drive.letter}'...` })
    const watcher = watch(drive.physicalPath, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
    })

    const ws = await this.getWebsocketService()

    watcher.on('error', (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error)
      void this.logger.error({ message: `Error watching volume '${drive.letter}': ${errorMessage}`, data: { error } })
      this.emit('error', { path: '', driveLetter: drive.letter, errorMessage, error })

      void ws.announce({ type: 'file-change', event: 'error', path: '', drive: drive.letter }, ({ injector }) =>
        isAuthorized(injector, 'admin'),
      )
    })

    watcher.on('all', (event, path) => {
      const relativePath = PathHelper.normalize(path.toString().replace(drive.physicalPath, '').replaceAll(sep, '/'))
      void this.logger.verbose({ message: `📁  Event '${event}' in volume '${drive.letter}': ${relativePath}` })
      this.emit(event, { path: relativePath, driveLetter: drive.letter })

      void ws.announce({ type: 'file-change', event, path: relativePath, drive: drive.letter }, ({ injector }) =>
        isAuthorized(injector, 'admin'),
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

  public init() {
    void this.startWatchCurrentDirectories().catch((error) => {
      void this.logger.error({ message: 'Failed to initialize file watchers', data: { error } })
    })
  }

  private async startWatchCurrentDirectories() {
    const driveDataSet = getDataSetFor(this.systemInjector, DriveDataSet)
    driveDataSet.subscribe('onEntityAdded', ({ entity }) => void this.addWatcher(entity))
    driveDataSet.subscribe('onEntityRemoved', ({ key }) => void this.removeWatcher(key))
    const allDrives = await driveDataSet.find(this.systemInjector, {})
    allDrives.forEach((drive) => void this.addWatcher(drive))
  }

  public async dispose() {
    await Promise.all(Object.values(this.watchers).map((w) => w.close()))
  }
}

export const FileWatcherService: Token<FileWatcherService, 'singleton'> = defineService({
  name: 'pi-rat/FileWatcherService',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const systemInjector = useSystemIdentityContext({ injector, username: 'file-watcher' })
    onDispose(() => systemInjector[Symbol.asyncDispose]())
    const impl = new FileWatcherServiceImpl(logger, systemInjector, () => injector.getAsync(WebsocketService))
    onDispose(() => impl.dispose())
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})

export const useFileWatchers = async (injector: Injector) => {
  injector.get(FileWatcherService).init()
}
