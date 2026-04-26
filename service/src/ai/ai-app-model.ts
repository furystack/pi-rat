import type { InternalAppModel } from '../AppModelManager.js'
import { AiManifest } from './ai-manifest.js'
import { setupAiRestApi } from './setup-ai-rest-api.js'
import { setupAi } from './setup-ai.js'

export const AiAppModel: InternalAppModel = {
  manifest: AiManifest,
  state: { type: 'initializing' },
  setup: async (injector) => {
    await Promise.all([setupAi(injector), setupAiRestApi(injector)])
  },
}
