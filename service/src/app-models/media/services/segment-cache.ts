import { Injectable, Injected, type Injector } from '@furystack/inject'
import { getLogger, type ScopedLogger } from '@furystack/logging'
import { promises, createReadStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { createHash } from 'crypto'
import { getDataSetFor } from '@furystack/repository'
import { Config, type MoviesConfig } from 'common'
import { useSystemIdentityContext } from '@furystack/core'

type CacheEntry = {
  key: string
  filePath: string
  size: number
  lastAccessed: number
}

const DEFAULT_MAX_CACHE_SIZE_MB = 5000

@Injectable({ lifetime: 'singleton' })
export class SegmentCache {
  declare injector: Injector

  @Injected((injector) => getLogger(injector).withScope('SegmentCache'))
  declare private logger: ScopedLogger

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'segment-cache' }))
  declare private systemInjector: Injector

  private entries = new Map<string, CacheEntry>()
  private totalSize = 0
  private cacheDir: string | null = null

  public dispose() {
    this.entries.clear()
    this.totalSize = 0
  }

  private buildCacheKey(
    driveLetter: string,
    path: string,
    segmentIndex: number,
    mode: string,
    resolution?: string,
    from?: number,
    to?: number,
  ): string {
    const input = `${driveLetter}:${path}:${segmentIndex}:${mode}:${resolution || ''}:${from ?? ''}:${to ?? ''}`
    return createHash('sha256').update(input).digest('hex').slice(0, 32)
  }

  private async getCacheDir(): Promise<string> {
    if (this.cacheDir) return this.cacheDir

    try {
      const configDataSet = getDataSetFor(this.injector, Config, 'id')
      const config = (await configDataSet.get(this.systemInjector, 'MOVIES_CONFIG')) as MoviesConfig | undefined
      const configuredPath = config?.value?.hlsSegmentPath
      this.cacheDir = configuredPath || join(tmpdir(), 'pirat-hls-cache')
    } catch {
      this.cacheDir = join(tmpdir(), 'pirat-hls-cache')
    }

    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true })
    }

    return this.cacheDir
  }

  private async getMaxCacheSize(): Promise<number> {
    try {
      const configDataSet = getDataSetFor(this.injector, Config, 'id')
      const config = (await configDataSet.get(this.systemInjector, 'MOVIES_CONFIG')) as MoviesConfig | undefined
      return (config?.value?.hlsMaxCacheSizeMb ?? DEFAULT_MAX_CACHE_SIZE_MB) * 1024 * 1024
    } catch {
      return DEFAULT_MAX_CACHE_SIZE_MB * 1024 * 1024
    }
  }

  public async get(
    driveLetter: string,
    path: string,
    segmentIndex: number,
    mode: string,
    resolution?: string,
    from?: number,
    to?: number,
  ): Promise<NodeJS.ReadableStream | null> {
    const key = this.buildCacheKey(driveLetter, path, segmentIndex, mode, resolution, from, to)
    const entry = this.entries.get(key)

    if (!entry) return null

    try {
      await promises.access(entry.filePath)
      entry.lastAccessed = Date.now()
      void this.logger.verbose({ message: `Cache hit: ${key}` })
      return createReadStream(entry.filePath)
    } catch {
      this.entries.delete(key)
      this.totalSize -= entry.size
      return null
    }
  }

  public async put(
    driveLetter: string,
    path: string,
    segmentIndex: number,
    mode: string,
    data: Buffer,
    resolution?: string,
    from?: number,
    to?: number,
  ): Promise<void> {
    const key = this.buildCacheKey(driveLetter, path, segmentIndex, mode, resolution, from, to)
    const cacheDir = await this.getCacheDir()
    const filePath = join(cacheDir, `${key}.m4s`)

    const maxSize = await this.getMaxCacheSize()
    while (this.totalSize + data.length > maxSize && this.entries.size > 0) {
      await this.evictLru()
    }

    try {
      await promises.writeFile(filePath, data)

      const entry: CacheEntry = {
        key,
        filePath,
        size: data.length,
        lastAccessed: Date.now(),
      }

      this.entries.set(key, entry)
      this.totalSize += data.length

      void this.logger.verbose({
        message: `Cached segment: ${key} (${(data.length / 1024 / 1024).toFixed(1)} MB)`,
      })
    } catch (error) {
      void this.logger.error({ message: `Failed to cache segment: ${key}`, data: { error } })
    }
  }

  public async has(
    driveLetter: string,
    path: string,
    segmentIndex: number,
    mode: string,
    resolution?: string,
    from?: number,
    to?: number,
  ): Promise<boolean> {
    const key = this.buildCacheKey(driveLetter, path, segmentIndex, mode, resolution, from, to)
    return this.entries.has(key)
  }

  private async evictLru(): Promise<void> {
    let oldest: CacheEntry | undefined
    for (const entry of this.entries.values()) {
      if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
        oldest = entry
      }
    }

    if (oldest) {
      try {
        await promises.unlink(oldest.filePath)
      } catch {
        // File may already be gone
      }
      this.entries.delete(oldest.key)
      this.totalSize -= oldest.size
      void this.logger.verbose({ message: `Evicted: ${oldest.key}` })
    }
  }

  public getStats() {
    return {
      entries: this.entries.size,
      totalSizeMb: Math.round(this.totalSize / 1024 / 1024),
    }
  }
}
