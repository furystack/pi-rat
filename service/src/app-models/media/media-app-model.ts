import type { InternalAppModel } from '../../AppModelManager.js'
import { MediaManifest } from './media-manifest.js'
import { setupMediaRestApi } from './setup-media-api.js'
import { setupMedia } from './setup-media.js'

export const MediaAppModel: InternalAppModel = {
  manifest: MediaManifest,
  state: { type: 'initializing' },
  setup: async (injector) => {
    await Promise.all([setupMedia(injector), setupMediaRestApi(injector)])
  },
}
