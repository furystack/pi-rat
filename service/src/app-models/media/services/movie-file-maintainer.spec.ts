import { Injector } from '@furystack/inject'
import { EventHub, usingAsync } from '@furystack/utils'
import type { PiRatFile } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MovieMaintainerService } from './movie-file-maintainer.js'

const mockMovieFileFind = vi.fn()
const mockMovieFileRemove = vi.fn().mockResolvedValue(undefined)
const mockConfigGet = vi.fn()

vi.mock('@furystack/repository', () => ({
  getDataSetFor: (_injector: unknown, model: { name?: string } | ((...args: unknown[]) => unknown)) => {
    const name = typeof model === 'function' ? model.name : ''
    if (name === 'MovieFile') {
      return {
        find: (...args: unknown[]) => mockMovieFileFind(...args) as unknown,
        remove: (...args: unknown[]) => mockMovieFileRemove(...args) as unknown,
      }
    }
    if (name === 'Config') {
      return {
        get: (...args: unknown[]) => mockConfigGet(...args) as unknown,
        subscribe: vi.fn().mockReturnValue({ [Symbol.dispose]: vi.fn() }),
      }
    }
    if (name === 'Drive') {
      return {
        find: vi.fn().mockResolvedValue([]),
      }
    }
    return {}
  },
}))

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
      debug: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

vi.mock('@furystack/core', () => ({
  useSystemIdentityContext: ({ injector }: { injector: unknown }) => injector,
}))

vi.mock('../utils/link-movie.js', () => ({
  linkMovie: vi.fn().mockResolvedValue({ status: 'linked' }),
}))

vi.mock('../utils/extract-subtitles.js', () => ({
  extractSubtitles: vi.fn().mockResolvedValue(undefined),
}))

type FileWatcherEvents = {
  add: PiRatFile
  addDir: PiRatFile
  change: PiRatFile
  unlink: PiRatFile
  unlinkDir: PiRatFile
  all: PiRatFile
  ready: PiRatFile
  raw: PiRatFile & { errorMessage: string; error: unknown }
}

let mockFileWatcher: EventHub<FileWatcherEvents>

vi.mock('../../drives/file-watcher-service.js', async () => {
  const { InjectableOptionsSymbol } = await vi.importActual<{ InjectableOptionsSymbol: symbol }>('@furystack/inject')

  class MockFileWatcherService {}
  Object.assign(MockFileWatcherService, {
    [InjectableOptionsSymbol]: { lifetime: 'singleton' },
  })

  return { FileWatcherService: MockFileWatcherService }
})

describe('MovieMaintainerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFileWatcher = new EventHub<FileWatcherEvents>()
  })

  const initService = async (injector: Injector) => {
    mockConfigGet.mockResolvedValue(undefined)

    const { FileWatcherService } = await import('../../drives/file-watcher-service.js')
    injector.setExplicitInstance(
      mockFileWatcher as unknown as InstanceType<typeof FileWatcherService>,
      FileWatcherService,
    )

    const service = injector.getInstance(MovieMaintainerService)
    service.init()
    await vi.waitFor(() => {
      expect(mockConfigGet).toHaveBeenCalled()
    })
    return service
  }

  describe('onUnlink', () => {
    it('should remove all matching movie files when a file is unlinked', async () => {
      const matchingMovies = [
        { id: 'movie-1', path: 'movies/test.mkv', driveLetter: 'A' },
        { id: 'movie-2', path: 'movies/test.mkv', driveLetter: 'A' },
      ]
      mockMovieFileFind.mockResolvedValue(matchingMovies)

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector)

        mockFileWatcher.emit('unlink', { path: 'movies/test.mkv', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockMovieFileRemove).toHaveBeenCalledWith(injector, 'movie-1', 'movie-2')
        })
      })
    })

    it('should not call remove when no matching movie files exist', async () => {
      mockMovieFileFind.mockResolvedValue([])

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector)

        mockFileWatcher.emit('unlink', { path: 'movies/nonexistent.mkv', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockMovieFileFind).toHaveBeenCalled()
        })

        expect(mockMovieFileRemove).not.toHaveBeenCalled()
      })
    })

    it('should remove a single matching movie file', async () => {
      mockMovieFileFind.mockResolvedValue([{ id: 'movie-1', path: 'movies/test.mkv', driveLetter: 'A' }])

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector)

        mockFileWatcher.emit('unlink', { path: 'movies/test.mkv', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockMovieFileRemove).toHaveBeenCalledWith(injector, 'movie-1')
        })
      })
    })
  })

  describe('onUnlinkDir', () => {
    it('should remove all movie files under the deleted directory', async () => {
      const matchingMovies = [
        { id: 'movie-1', path: 'movies/dir/file1.mkv', driveLetter: 'A' },
        { id: 'movie-2', path: 'movies/dir/file2.mkv', driveLetter: 'A' },
        { id: 'movie-3', path: 'movies/dir/sub/file3.mkv', driveLetter: 'A' },
      ]
      mockMovieFileFind.mockResolvedValue(matchingMovies)

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector)

        mockFileWatcher.emit('unlinkDir', { path: 'movies/dir', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockMovieFileRemove).toHaveBeenCalledWith(injector, 'movie-1', 'movie-2', 'movie-3')
        })
      })
    })

    it('should not call remove when no matching movie files exist under directory', async () => {
      mockMovieFileFind.mockResolvedValue([])

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector)

        mockFileWatcher.emit('unlinkDir', { path: 'movies/empty-dir', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockMovieFileFind).toHaveBeenCalled()
        })

        expect(mockMovieFileRemove).not.toHaveBeenCalled()
      })
    })
  })
})
