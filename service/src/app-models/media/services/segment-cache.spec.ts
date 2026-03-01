import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

vi.mock('@furystack/core', () => ({
  useSystemIdentityContext: ({ injector }: { injector: unknown }) => injector,
}))

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue({ [Symbol.dispose]: vi.fn() }),
  }),
}))

vi.mock('fs', () => ({
  promises: {
    access: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
  createReadStream: vi.fn().mockReturnValue({ pipe: vi.fn() }),
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}))

import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { SegmentCache } from './segment-cache.js'

describe('SegmentCache', () => {
  let cache: SegmentCache

  beforeEach(async () => {
    await usingAsync(new Injector(), async (injector) => {
      cache = injector.getInstance(SegmentCache)
    })
  })

  it('should start with empty stats', () => {
    const stats = cache.getStats()
    expect(stats.entries).toBe(0)
    expect(stats.totalSizeMb).toBe(0)
  })

  it('should return null for cache miss', async () => {
    const result = await cache.get('A', 'test.mkv', 0, 'transcode')
    expect(result).toBeNull()
  })

  it('should report false for has() on cache miss', async () => {
    const result = await cache.has('A', 'test.mkv', 0, 'transcode')
    expect(result).toBe(false)
  })

  it('should report true for has() after put()', async () => {
    const data = Buffer.from('test segment data')
    await cache.put('A', 'test.mkv', 0, 'transcode', data)

    const result = await cache.has('A', 'test.mkv', 0, 'transcode')
    expect(result).toBe(true)
  })

  it('should generate different keys for different parameters', async () => {
    const data = Buffer.from('test')
    await cache.put('A', 'test.mkv', 0, 'transcode', data)
    await cache.put('A', 'test.mkv', 1, 'transcode', data)

    const stats = cache.getStats()
    expect(stats.entries).toBe(2)
  })

  it('should generate different keys with resolution parameter', async () => {
    const data = Buffer.from('test')
    await cache.put('A', 'test.mkv', 0, 'transcode', data, '720p')
    await cache.put('A', 'test.mkv', 0, 'transcode', data, '1080p')

    const stats = cache.getStats()
    expect(stats.entries).toBe(2)
  })

  it('should update totalSize after put()', async () => {
    const data = Buffer.alloc(1024 * 1024)
    await cache.put('A', 'test.mkv', 0, 'transcode', data)

    const stats = cache.getStats()
    expect(stats.totalSizeMb).toBe(1)
  })

  it('should return a readable stream from get() after put()', async () => {
    const data = Buffer.from('test segment data')
    await cache.put('A', 'test.mkv', 0, 'transcode', data)

    const result = await cache.get('A', 'test.mkv', 0, 'transcode')
    expect(result).not.toBeNull()
  })

  it('should return null from get() when file is missing on disk', async () => {
    const { promises: fsPromises } = await import('fs')
    const data = Buffer.from('test')
    await cache.put('A', 'test.mkv', 0, 'transcode', data)

    vi.mocked(fsPromises.access).mockRejectedValueOnce(new Error('ENOENT'))

    const result = await cache.get('A', 'test.mkv', 0, 'transcode')
    expect(result).toBeNull()
    expect(cache.getStats().entries).toBe(0)
  })

  it('should clear entries on dispose', async () => {
    const data = Buffer.from('test')
    await cache.put('A', 'test.mkv', 0, 'transcode', data)
    expect(cache.getStats().entries).toBe(1)

    cache.dispose()
    expect(cache.getStats().entries).toBe(0)
    expect(cache.getStats().totalSizeMb).toBe(0)
  })

  it('should evict oldest entries when cache exceeds max size', async () => {
    const { promises: fsPromises } = await import('fs')

    // Override getMaxCacheSize to return a small value (100 bytes)
    ;(cache as unknown as { getMaxCacheSize: () => Promise<number> }).getMaxCacheSize = async () => 100

    const data50 = Buffer.alloc(50, 'a')
    const data60 = Buffer.alloc(60, 'b')

    await cache.put('A', 'test.mkv', 0, 'transcode', data50)
    expect(cache.getStats().entries).toBe(1)

    await cache.put('A', 'test.mkv', 1, 'transcode', data60)

    // Segment 0 should be evicted to make room for segment 1
    expect(cache.getStats().entries).toBe(1)
    expect(await cache.has('A', 'test.mkv', 0, 'transcode')).toBe(false)
    expect(await cache.has('A', 'test.mkv', 1, 'transcode')).toBe(true)
    expect(vi.mocked(fsPromises.unlink)).toHaveBeenCalled()
  })
})
