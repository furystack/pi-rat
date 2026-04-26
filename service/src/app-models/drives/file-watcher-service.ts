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

export type FileWatcherService = EventHub<FileWatcherEvents> & {
  addWatcher(drive: Drive): Promise<void>
  removeWatcher(letter: string): Promise<void>
  dispose(): Promise<void>
}

export const FileWatcherService: Token<FileWatcherService, 'singleton'> = defineService({
  name: 'pi-rat/FileWatcherService',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const systemInjector = useSystemIdentityContext({ injector, username: 'file-watcher' })
    const hub = new EventHub<FileWatcherEvents>()
    const watchers: Record<string, FSWatcher> = {}

    const addWatcher = async (drive: Drive) => {
      if (watchers[drive.letter]) {
        throw new Error(`Watcher for drive '${drive.letter}' already exists`)
      }

      await logger.verbose({ message: `🔍  Starting File Watcher on volume '${drive.letter}'...` })
      const watcher = watch(drive.physicalPath, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
      })

      const ws = await injector.getAsync(WebsocketService)

      watcher.on('error', (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error)
        void logger.error({ message: `Error watching volume '${drive.letter}': ${errorMessage}`, data: { error } })
        hub.emit('error', { path: '', driveLetter: drive.letter, errorMessage, error })

        void ws.announce({ type: 'file-change', event: 'error', path: '', drive: drive.letter }, ({ injector: i }) =>
          isAuthorized(i, 'admin'),
        )
      })

      watcher.on('all', (event, path) => {
        const relativePath = PathHelper.normalize(path.toString().replace(drive.physicalPath, '').replaceAll(sep, '/'))
        void logger.verbose({ message: `📁  Event '${event}' in volume '${drive.letter}': ${relativePath}` })
        hub.emit(event, { path: relativePath, driveLetter: drive.letter })

        void ws.announce({ type: 'file-change', event, path: relativePath, drive: drive.letter }, ({ injector: i }) =>
          isAuthorized(i, 'admin'),
        )
      })

      watchers[drive.letter] = watcher
    }

    const removeWatcher = async (letter: string) => {
      if (watchers[letter]) {
        await watchers[letter].close()
        delete watchers[letter]
        await logger.information({ message: `🔍  Stopping File Watcher on volume '${letter}'...` })
      } else {
        await logger.warning({ message: `Attempted to remove watcher for drive '${letter}', but no watcher exists` })
      }
    }

    const dispose = async () => {
      await Promise.all(Object.values(watchers).map((w) => w.close()))
    }

    const startWatchCurrentDirectories = async () => {
      const driveDataSet = getDataSetFor(systemInjector, DriveDataSet)
      driveDataSet.subscribe('onEntityAdded', ({ entity }) => void addWatcher(entity))
      driveDataSet.subscribe('onEntityRemoved', ({ key }) => void removeWatcher(key))
      const allDrives = await driveDataSet.find(systemInjector, {})
      allDrives.forEach((drive) => void addWatcher(drive))
    }

    void startWatchCurrentDirectories().catch((error) => {
      void logger.error({ message: 'Failed to initialize file watchers', data: { error } })
    })

    onDispose(() => dispose())
    onDispose(() => systemInjector[Symbol.asyncDispose]())
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to caller
    onDispose(() => hub[Symbol.dispose]())

    return Object.assign(hub, {
      addWatcher,
      removeWatcher,
      dispose,
    })
  },
})

export const useFileWatchers = async (injector: Injector) => {
  injector.get(FileWatcherService)
}
