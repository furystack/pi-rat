import { Cache } from '@furystack/cache'
import { getStoreManager } from '@furystack/core'
import { Injectable, type Injector } from '@furystack/inject'
import { Drive } from 'common'

@Injectable({
  lifetime: 'singleton',
})
export class StreamFileActionCaches {
  declare public injector: Injector

  public driveCache = new Cache({
    load: async (key: string) => {
      const driveStore = getStoreManager(this.injector).getStoreFor(Drive, 'letter')
      const drive = await driveStore.get(key)
      return drive
    },
  })
}
