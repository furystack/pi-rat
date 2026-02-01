import { Injectable, type Injector } from '@furystack/inject'
import type { AppState } from 'common'
import type { InternalAppModel } from '../../AppModelManager.js'
import { MediaManifest } from './media-manifest.js'
import { setupMediaRestApi } from './setup-media-api.js'
import { setupMedia } from './setup-media.js'

@Injectable({
  lifetime: 'singleton',
})
export class MediaAppModel implements InternalAppModel {
  manifest = MediaManifest
  state: AppState = {
    type: 'initializing',
  }

  declare private injector: Injector

  public async setup() {
    await Promise.all([setupMedia(this.injector), setupMediaRestApi(this.injector)])
  }
}
