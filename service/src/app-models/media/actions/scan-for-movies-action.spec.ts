import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { PiRatFile } from 'common'

const mockGetBody = vi.fn()
const mockLogger = {
  verbose: vi.fn().mockResolvedValue(undefined),
  information: vi.fn().mockResolvedValue(undefined),
  error: vi.fn().mockResolvedValue(undefined),
}
const mockLinkMovie = vi.fn()
const mockExtractSubtitles = vi.fn().mockResolvedValue(undefined)
const mockCheckFolderForPossibleMovieFiles = vi.fn()
const mockDriveGet = vi.fn()
const mockMovieFileFind = vi.fn()

vi.mock('@furystack/core', () => ({
  useSystemIdentityContext: () => ({}),
}))

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => mockLogger,
  }),
}))

vi.mock('@furystack/repository', () => ({
  getDataSetFor: (_injector: unknown, model: { name?: string } | ((...args: unknown[]) => unknown)) => {
    const name = typeof model === 'function' ? model.name : ''
    if (name === 'Drive') {
      return { get: mockDriveGet }
    }
    if (name === 'MovieFile') {
      return { find: mockMovieFileFind }
    }
    return {}
  },
}))

vi.mock('@furystack/inject', () => ({
  Injectable: () => (target: unknown) => target,
  Injected: () => () => undefined,
}))

vi.mock('../services/movie-file-maintainer.js', () => ({
  MovieMaintainerService: class {
    checkFolderForPossibleMovieFiles = mockCheckFolderForPossibleMovieFiles
  },
}))

vi.mock('../utils/link-movie.js', () => ({
  linkMovie: (...args: unknown[]) => mockLinkMovie(...args) as unknown,
}))

vi.mock('../utils/extract-subtitles.js', () => ({
  extractSubtitles: (...args: unknown[]) => mockExtractSubtitles(...args) as unknown,
}))

const { ScanForMoviesAction } = await import('./scan-for-movies-action.js')

const createFile = (path: string): PiRatFile => ({
  driveLetter: 'A',
  path,
})

describe('ScanForMoviesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDriveGet.mockResolvedValue({ letter: 'A', physicalPath: '/mnt/movies' })
    mockMovieFileFind.mockResolvedValue([])
  })

  const callAction = () =>
    ScanForMoviesAction({
      injector: {
        getInstance: vi.fn().mockReturnValue({
          checkFolderForPossibleMovieFiles: mockCheckFolderForPossibleMovieFiles,
        }),
      },
      getBody: mockGetBody,
    } as never)

  it('should return empty result when no files found', async () => {
    mockGetBody.mockResolvedValue({ root: createFile('/movies'), autoExtractSubtitles: false })
    mockCheckFolderForPossibleMovieFiles.mockResolvedValue([])

    const response = await callAction()
    const { chunk } = response as { chunk: { added: unknown[]; progress: { total: number } } }

    expect(chunk.added).toEqual([])
    expect(chunk.progress.total).toBe(0)
  })

  it('should link found movie files and return progress', async () => {
    const files = [createFile('/movies/Movie.2024.mkv'), createFile('/movies/Other.2024.mkv')]
    mockGetBody.mockResolvedValue({ root: createFile('/movies'), autoExtractSubtitles: false })
    mockCheckFolderForPossibleMovieFiles.mockResolvedValue(files)
    mockLinkMovie.mockResolvedValue({
      status: 'linked',
      movieFile: { id: '1', path: '/movies/Movie.2024.mkv' },
      movie: {},
    })

    const response = await callAction()
    const { chunk } = response as { chunk: { added: unknown[]; progress: { total: number; linked: number } } }

    expect(chunk.added).toHaveLength(2)
    expect(chunk.progress.total).toBe(2)
    expect(chunk.progress.linked).toBe(2)
    expect(mockLinkMovie).toHaveBeenCalledTimes(2)
  })

  it('should extract subtitles only for linked files when autoExtractSubtitles is true', async () => {
    const files = [createFile('/movies/Movie.2024.mkv'), createFile('/movies/Other.2024.mkv')]
    mockGetBody.mockResolvedValue({ root: createFile('/movies'), autoExtractSubtitles: true })
    mockCheckFolderForPossibleMovieFiles.mockResolvedValue(files)

    mockLinkMovie
      .mockResolvedValueOnce({ status: 'linked', movieFile: { id: '1' }, movie: {} })
      .mockResolvedValueOnce({ status: 'already-linked' })

    const response = await callAction()
    const { chunk } = response as { chunk: { progress: { linked: number; alreadyLinked: number } } }

    expect(chunk.progress.linked).toBe(1)
    expect(chunk.progress.alreadyLinked).toBe(1)
    expect(mockExtractSubtitles).toHaveBeenCalledTimes(1)
  })

  it('should not extract subtitles when autoExtractSubtitles is false', async () => {
    mockGetBody.mockResolvedValue({ root: createFile('/movies'), autoExtractSubtitles: false })
    mockCheckFolderForPossibleMovieFiles.mockResolvedValue([createFile('/movies/Movie.2024.mkv')])
    mockLinkMovie.mockResolvedValue({ status: 'linked', movieFile: { id: '1' }, movie: {} })

    await callAction()

    expect(mockExtractSubtitles).not.toHaveBeenCalled()
  })

  it('should handle linkMovie errors gracefully and continue', async () => {
    const files = [createFile('/movies/Fail.2024.mkv'), createFile('/movies/Ok.2024.mkv')]
    mockGetBody.mockResolvedValue({ root: createFile('/movies'), autoExtractSubtitles: false })
    mockCheckFolderForPossibleMovieFiles.mockResolvedValue(files)

    mockLinkMovie
      .mockRejectedValueOnce(new Error('unexpected error'))
      .mockResolvedValueOnce({ status: 'linked', movieFile: { id: '2' }, movie: {} })

    const response = await callAction()
    const { chunk } = response as { chunk: { added: unknown[]; progress: { failed: number; linked: number } } }

    expect(chunk.added).toHaveLength(1)
    expect(chunk.progress.failed).toBe(1)
    expect(chunk.progress.linked).toBe(1)
    expect(mockLogger.error).toHaveBeenCalled()
  })

  it('should track rate-limited results in progress', async () => {
    mockGetBody.mockResolvedValue({ root: createFile('/movies'), autoExtractSubtitles: false })
    mockCheckFolderForPossibleMovieFiles.mockResolvedValue([createFile('/movies/Movie.2024.mkv')])
    mockLinkMovie.mockResolvedValue({ status: 'rate-limited' })

    const response = await callAction()
    const { chunk } = response as { chunk: { progress: { rateLimited: number } } }

    expect(chunk.progress.rateLimited).toBe(1)
  })

  it('should throw RequestError when drive is not found', async () => {
    mockGetBody.mockResolvedValue({ root: createFile('/movies'), autoExtractSubtitles: false })
    mockDriveGet.mockResolvedValue(undefined)

    await expect(callAction()).rejects.toThrow()
  })
})
