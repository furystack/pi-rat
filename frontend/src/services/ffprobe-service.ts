import { Cache } from '@furystack/cache'
import { defineService, type Token } from '@furystack/inject'
import type { PiRatFile } from 'common'
import { DrivesApiClient } from './api-clients/drives-api-client.js'

class FfprobeServiceImpl implements Disposable {
  public ffprobeCache = new Cache({
    capacity: 100,
    load: async (file: PiRatFile) => {
      const { result } = await this.drivesApiClient.call({
        method: 'GET',
        action: '/files/:letter/:path/ffprobe',
        url: { letter: file.driveLetter, path: file.path },
      })
      return result
    },
  })

  constructor(private readonly drivesApiClient: DrivesApiClient) {}

  public getFfprobe = this.ffprobeCache.get.bind(this.ffprobeCache)
  public getFfprobeAsObservable = this.ffprobeCache.getObservable.bind(this.ffprobeCache)

  public [Symbol.dispose](): void {
    this.ffprobeCache[Symbol.dispose]()
  }
}

export type FfprobeService = FfprobeServiceImpl

export const FfprobeService: Token<FfprobeService, 'singleton'> = defineService({
  name: 'pi-rat/FfprobeService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new FfprobeServiceImpl(inject(DrivesApiClient))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
