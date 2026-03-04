import { Injector } from '@furystack/inject'
import { EventHub, usingAsync } from '@furystack/utils'
import type { MoviesConfig, PiRatFile } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MovieMaintainerService } from './movie-file-maintainer.js'

const mockMovieFileFind = vi.fn()
const mockMovieFileRemove = vi.fn().mockResolvedValue(undefined)
const mockConfigGet = vi.fn()
const mockDriveFind = vi.fn().mockResolvedValue([])
const mockLinkMovie = vi.fn().mockResolvedValue({ status: 'linked' })
const mockExtractSubtitles = vi.fn().mockResolvedValue(undefined)

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
        find: (...args: unknown[]) => mockDriveFind(...args) as unknown,
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
  linkMovie: (...args: unknown[]) => mockLinkMovie(...args) as unknown,
}))

vi.mock('../utils/extract-subtitles.js', () => ({
  extractSubtitles: (...args: unknown[]) => mockExtractSubtitles(...args) as unknown,
}))

vi.mock('../../../utils/exists-async.js', () => ({
  existsAsync: vi.fn().mockResolvedValue(true),
}))

vi.mock('../../drives/utils/dirent-to-api-model.js', () => ({
  direntToApiModel: (entry: { name: string; isFile: () => boolean; isDirectory: () => boolean }) => ({
    name: entry.name,
    isFile: entry.isFile(),
    isDirectory: entry.isDirectory(),
  }),
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

const createMoviesConfig = (overrides?: Partial<MoviesConfig['value']>): MoviesConfig => ({
  id: 'MOVIES_CONFIG',
  value: {
    watchFiles: 'all',
    ...overrides,
  },
})

describe('MovieMaintainerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFileWatcher = new EventHub<FileWatcherEvents>()
    mockLinkMovie.mockResolvedValue({ status: 'linked' })
    mockDriveFind.mockResolvedValue([])
  })

  const initService = async (injector: Injector, config?: MoviesConfig) => {
    mockConfigGet.mockResolvedValue(config)

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

  describe('onAdd', () => {
    it('should link a movie file when config allows', async () => {
      const config = createMoviesConfig()

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'movies/Test.Movie.2024.mkv', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockLinkMovie).toHaveBeenCalledWith(
            expect.objectContaining({
              file: { path: 'movies/Test.Movie.2024.mkv', driveLetter: 'A' },
            }),
          )
        })
      })
    })

    it('should skip linking when config is not set', async () => {
      await usingAsync(new Injector(), async (injector) => {
        await initService(injector)

        mockFileWatcher.emit('add', { path: 'movies/Test.Movie.mkv', driveLetter: 'A' })

        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(mockLinkMovie).not.toHaveBeenCalled()
      })
    })

    it('should skip linking when file is not in watched directories', async () => {
      const config = createMoviesConfig({
        watchFiles: [{ drive: 'B', path: 'other/' }],
      })

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'movies/Test.Movie.mkv', driveLetter: 'A' })

        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(mockLinkMovie).not.toHaveBeenCalled()
      })
    })

    it('should extract subtitles when linked and autoExtractSubtitles is enabled', async () => {
      const config = createMoviesConfig({ autoExtractSubtitles: true })
      mockLinkMovie.mockResolvedValue({ status: 'linked' })

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'movies/Test.Movie.2024.mkv', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockExtractSubtitles).toHaveBeenCalled()
        })
      })
    })

    it('should not extract subtitles when linked but autoExtractSubtitles is disabled', async () => {
      const config = createMoviesConfig({ autoExtractSubtitles: false })
      mockLinkMovie.mockResolvedValue({ status: 'linked' })

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'movies/Test.Movie.2024.mkv', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockLinkMovie).toHaveBeenCalled()
        })
        expect(mockExtractSubtitles).not.toHaveBeenCalled()
      })
    })

    it('should not extract subtitles when linkMovie returns non-linked status', async () => {
      const config = createMoviesConfig({ autoExtractSubtitles: true })
      mockLinkMovie.mockResolvedValue({ status: 'already-linked' })

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'movies/Test.Movie.2024.mkv', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockLinkMovie).toHaveBeenCalled()
        })
        expect(mockExtractSubtitles).not.toHaveBeenCalled()
      })
    })

    it('should not throw when subtitle extraction fails', async () => {
      const config = createMoviesConfig({ autoExtractSubtitles: true })
      mockLinkMovie.mockResolvedValue({ status: 'linked' })
      mockExtractSubtitles.mockRejectedValue(new Error('Subtitle extraction failed'))

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'movies/Test.Movie.2024.mkv', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockExtractSubtitles).toHaveBeenCalled()
        })
      })
    })
  })

  describe('shouldTryLinkMovie', () => {
    it('should match when watchFiles is "all"', async () => {
      const config = createMoviesConfig({ watchFiles: 'all' })
      mockLinkMovie.mockResolvedValue({ status: 'linked' })

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'any/path/movie.mkv', driveLetter: 'X' })

        await vi.waitFor(() => {
          expect(mockLinkMovie).toHaveBeenCalled()
        })
      })
    })

    it('should match when file is in a watched drive and path', async () => {
      const config = createMoviesConfig({
        watchFiles: [{ drive: 'A', path: 'movies/' }],
      })
      mockLinkMovie.mockResolvedValue({ status: 'linked' })

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'movies/Test.Movie.mkv', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockLinkMovie).toHaveBeenCalled()
        })
      })
    })

    it('should match when watchConfig has no path filter', async () => {
      const config = createMoviesConfig({
        watchFiles: [{ drive: 'A' }],
      })
      mockLinkMovie.mockResolvedValue({ status: 'linked' })

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'anywhere/movie.mkv', driveLetter: 'A' })

        await vi.waitFor(() => {
          expect(mockLinkMovie).toHaveBeenCalled()
        })
      })
    })

    it('should not match when file is on a different drive', async () => {
      const config = createMoviesConfig({
        watchFiles: [{ drive: 'B', path: 'movies/' }],
      })

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'movies/Test.Movie.mkv', driveLetter: 'A' })

        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(mockLinkMovie).not.toHaveBeenCalled()
      })
    })

    it('should not match when file path does not start with watched path', async () => {
      const config = createMoviesConfig({
        watchFiles: [{ drive: 'A', path: 'movies/' }],
      })

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        mockFileWatcher.emit('add', { path: 'documents/file.mkv', driveLetter: 'A' })

        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(mockLinkMovie).not.toHaveBeenCalled()
      })
    })
  })

  describe('initAsync', () => {
    it('should trigger fullSync when fullSyncOnStartup is true', async () => {
      const config = createMoviesConfig({ fullSyncOnStartup: true })
      mockMovieFileFind.mockResolvedValue([])

      await usingAsync(new Injector(), async (injector) => {
        const service = await initService(injector, config)

        await vi.waitFor(() => {
          expect(mockDriveFind).toHaveBeenCalled()
        })

        expect(service).toBeDefined()
      })
    })

    it('should not trigger fullSync when fullSyncOnStartup is false', async () => {
      const config = createMoviesConfig({ fullSyncOnStartup: false })

      await usingAsync(new Injector(), async (injector) => {
        await initService(injector, config)

        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(mockDriveFind).not.toHaveBeenCalled()
      })
    })

    it('should not trigger fullSync when config is undefined', async () => {
      await usingAsync(new Injector(), async (injector) => {
        await initService(injector)

        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(mockDriveFind).not.toHaveBeenCalled()
      })
    })

    it('should re-subscribe on re-init without errors', async () => {
      const config = createMoviesConfig()

      await usingAsync(new Injector(), async (injector) => {
        const service = await initService(injector, config)
        const initialCallCount = mockConfigGet.mock.calls.length

        mockConfigGet.mockResolvedValue(config)
        service.init()
        await vi.waitFor(() => {
          expect(mockConfigGet.mock.calls.length).toBeGreaterThan(initialCallCount)
        })
      })
    })
  })

  describe('fullSync', () => {
    it('should return progress with correct counts', async () => {
      const config = createMoviesConfig()
      mockMovieFileFind.mockResolvedValue([])
      mockDriveFind.mockResolvedValue([{ letter: 'A', physicalPath: '/mnt/a' }])

      const mockCheckFolder = vi.fn().mockResolvedValue([
        { driveLetter: 'A', path: 'movie1.mkv' },
        { driveLetter: 'A', path: 'movie2.mkv' },
        { driveLetter: 'A', path: 'movie3.mkv' },
      ])

      const linkResults = [{ status: 'linked' }, { status: 'already-linked' }, { status: 'rate-limited' }]
      let callIndex = 0
      mockLinkMovie.mockImplementation(() => Promise.resolve(linkResults[callIndex++]))

      await usingAsync(new Injector(), async (injector) => {
        const service = await initService(injector, config)
        service.checkFolderForPossibleMovieFiles = mockCheckFolder

        const progress = await service.fullSync()

        expect(progress.total).toBe(3)
        expect(progress.linked).toBe(1)
        expect(progress.alreadyLinked).toBe(1)
        expect(progress.rateLimited).toBe(1)
      })
    })

    it('should process files sequentially', async () => {
      const config = createMoviesConfig()
      mockMovieFileFind.mockResolvedValue([])
      mockDriveFind.mockResolvedValue([{ letter: 'A', physicalPath: '/mnt/a' }])

      const callOrder: number[] = []

      const mockCheckFolder = vi.fn().mockResolvedValue([
        { driveLetter: 'A', path: 'movie1.mkv' },
        { driveLetter: 'A', path: 'movie2.mkv' },
      ])

      mockLinkMovie.mockImplementation(async () => {
        callOrder.push(callOrder.length)
        return { status: 'linked' }
      })

      await usingAsync(new Injector(), async (injector) => {
        const service = await initService(injector, config)
        service.checkFolderForPossibleMovieFiles = mockCheckFolder

        await service.fullSync()

        expect(callOrder).toEqual([0, 1])
        expect(mockLinkMovie).toHaveBeenCalledTimes(2)
      })
    })

    it('should continue processing when a file fails to link', async () => {
      const config = createMoviesConfig()
      mockMovieFileFind.mockResolvedValue([])
      mockDriveFind.mockResolvedValue([{ letter: 'A', physicalPath: '/mnt/a' }])

      const mockCheckFolder = vi.fn().mockResolvedValue([
        { driveLetter: 'A', path: 'movie1.mkv' },
        { driveLetter: 'A', path: 'movie2.mkv' },
      ])

      mockLinkMovie.mockRejectedValueOnce(new Error('Link failed')).mockResolvedValueOnce({ status: 'linked' })

      await usingAsync(new Injector(), async (injector) => {
        const service = await initService(injector, config)
        service.checkFolderForPossibleMovieFiles = mockCheckFolder

        const progress = await service.fullSync()

        expect(progress.failed).toBe(1)
        expect(progress.linked).toBe(1)
        expect(mockLinkMovie).toHaveBeenCalledTimes(2)
      })
    })

    it('should return empty progress when no movie files found', async () => {
      const config = createMoviesConfig()
      mockMovieFileFind.mockResolvedValue([])
      mockDriveFind.mockResolvedValue([{ letter: 'A', physicalPath: '/mnt/a' }])

      const mockCheckFolder = vi.fn().mockResolvedValue([])

      await usingAsync(new Injector(), async (injector) => {
        const service = await initService(injector, config)
        service.checkFolderForPossibleMovieFiles = mockCheckFolder

        const progress = await service.fullSync()

        expect(progress.total).toBe(0)
        expect(progress.linked).toBe(0)
        expect(mockLinkMovie).not.toHaveBeenCalled()
      })
    })
  })
})
