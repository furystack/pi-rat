import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureSeriesExists } from './ensure-series-exists.js'

const mockGet = vi.fn()
const mockAdd = vi.fn()

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: (...args: unknown[]) => mockGet(...args) as unknown,
    add: (...args: unknown[]) => mockAdd(...args) as unknown,
  }),
}))

describe('ensureSeriesExists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const seriesInput = {
    imdbId: 'tt1234567',
    year: '2020',
    numberOfSeasons: 5,
  }

  it('should not create a new series when one already exists', async () => {
    const existing = { imdbId: 'tt1234567', year: '2020' }
    mockGet.mockResolvedValue(existing)

    await usingAsync(new Injector(), async (injector) => {
      await ensureSeriesExists(seriesInput, injector)

      expect(mockGet).toHaveBeenCalledWith(injector, 'tt1234567')
      expect(mockAdd).not.toHaveBeenCalled()
    })
  })

  it('should create a new series when not found', async () => {
    mockGet.mockResolvedValue(null)
    mockAdd.mockResolvedValue({ created: [{ ...seriesInput }] })

    await usingAsync(new Injector(), async (injector) => {
      await ensureSeriesExists(seriesInput, injector)

      expect(mockAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          imdbId: 'tt1234567',
          year: '2020',
          numberOfSeasons: 5,
        }),
      )
    })
  })

  it('should set timestamps on creation', async () => {
    mockGet.mockResolvedValue(null)
    mockAdd.mockResolvedValue({ created: [{}] })

    await usingAsync(new Injector(), async (injector) => {
      await ensureSeriesExists(seriesInput, injector)

      const addCall = mockAdd.mock.calls[0][1] as Record<string, unknown>
      expect(addCall.createdAt).toBeDefined()
      expect(addCall.updatedAt).toBeDefined()
      expect(typeof addCall.createdAt).toBe('string')
      expect(typeof addCall.updatedAt).toBe('string')
    })
  })

  it('should create a series without numberOfSeasons', async () => {
    mockGet.mockResolvedValue(null)
    mockAdd.mockResolvedValue({ created: [{}] })

    const input = { imdbId: 'tt9999999', year: '2015' }

    await usingAsync(new Injector(), async (injector) => {
      await ensureSeriesExists(input, injector)

      expect(mockAdd).toHaveBeenCalledWith(
        injector,
        expect.objectContaining({
          imdbId: 'tt9999999',
          year: '2015',
          numberOfSeasons: undefined,
        }),
      )
    })
  })
})
