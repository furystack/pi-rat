import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensureMovieLocalizedMetadataExists,
  ensureSeriesLocalizedMetadataExists,
} from './ensure-localized-metadata-exists.js'

const mockFind = vi.fn()
const mockAdd = vi.fn()

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    find: (...args: unknown[]) => mockFind(...args) as unknown,
    add: (...args: unknown[]) => mockAdd(...args) as unknown,
  }),
}))

describe('ensureMovieLocalizedMetadataExists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const movieData = {
    movieImdbId: 'tt1234567',
    language: 'en',
    title: 'Test Movie',
    plot: 'A test plot.',
    posterUrl: 'https://example.com/poster.jpg',
    genre: ['Action'],
    source: 'omdb' as const,
    sourceId: 'tt1234567',
  }

  it('should return existing record when found', async () => {
    const existing = { ...movieData, id: 'existing-id' }
    mockFind.mockResolvedValue([existing])

    await usingAsync(new Injector(), async (injector) => {
      const result = await ensureMovieLocalizedMetadataExists(movieData, injector)

      expect(mockFind).toHaveBeenCalledWith(injector, {
        filter: {
          movieImdbId: { $eq: 'tt1234567' },
          language: { $eq: 'en' },
          source: { $eq: 'omdb' },
        },
        top: 1,
      })
      expect(mockAdd).not.toHaveBeenCalled()
      expect(result).toBe(existing)
    })
  })

  it('should create new record when not found', async () => {
    const newRecord = { ...movieData, id: 'new-id' }
    mockFind.mockResolvedValue([])
    mockAdd.mockResolvedValue({ created: [newRecord] })

    await usingAsync(new Injector(), async (injector) => {
      const result = await ensureMovieLocalizedMetadataExists(movieData, injector)

      expect(mockAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          movieImdbId: 'tt1234567',
          language: 'en',
          source: 'omdb',
          title: 'Test Movie',
        }),
      )
      expect(result).toBe(newRecord)
    })
  })
})

describe('ensureSeriesLocalizedMetadataExists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const seriesData = {
    seriesImdbId: 'tt9876543',
    language: 'en',
    title: 'Test Series',
    plot: 'A test series.',
    posterUrl: 'https://example.com/series-poster.jpg',
    source: 'tmdb' as const,
    sourceId: '67890',
  }

  it('should return existing record when found', async () => {
    const existing = { ...seriesData, id: 'existing-id' }
    mockFind.mockResolvedValue([existing])

    await usingAsync(new Injector(), async (injector) => {
      const result = await ensureSeriesLocalizedMetadataExists(seriesData, injector)

      expect(mockFind).toHaveBeenCalledWith(injector, {
        filter: {
          seriesImdbId: { $eq: 'tt9876543' },
          language: { $eq: 'en' },
          source: { $eq: 'tmdb' },
        },
        top: 1,
      })
      expect(mockAdd).not.toHaveBeenCalled()
      expect(result).toBe(existing)
    })
  })

  it('should create new record when not found', async () => {
    const newRecord = { ...seriesData, id: 'new-id' }
    mockFind.mockResolvedValue([])
    mockAdd.mockResolvedValue({ created: [newRecord] })

    await usingAsync(new Injector(), async (injector) => {
      const result = await ensureSeriesLocalizedMetadataExists(seriesData, injector)

      expect(mockAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          seriesImdbId: 'tt9876543',
          language: 'en',
          source: 'tmdb',
          title: 'Test Series',
        }),
      )
      expect(result).toBe(newRecord)
    })
  })
})
