import { Cache } from '@furystack/cache'
import { Injectable, Injected } from '@furystack/inject'
import { PiRatFile } from 'common'
import { DrivesApiClient } from './api-clients/drives-api-client.js'

@Injectable({ lifetime: 'singleton' })
export class FfprobeService {
  @Injected(DrivesApiClient)
  private declare readonly mediaApiClient: DrivesApiClient

  public ffprobeCache = new Cache({
    capacity: 100,
    load: async (file: PiRatFile) => {
      const { result } = await this.mediaApiClient.call({
        method: 'GET',
        action: '/files/:letter/:path/ffprobe',
        url: { letter: file.driveLetter, path: file.path },
      })
      return result
    },
  })

  public getFfprobe = this.ffprobeCache.get.bind(this.ffprobeCache)

  public getFfprobeAsObservable = this.ffprobeCache.getObservable.bind(this.ffprobeCache)
}
