import type { InternalAppModel } from '../../AppModelManager.js'
import { IdentityManifest } from './identity-manifest.js'
import { setupIdentityRestApi } from './setup-identity-rest-api.js'
import { setupIdentity } from './setup-identity-store.js'

export const IdentityAppModel: InternalAppModel = {
  manifest: IdentityManifest,
  state: { type: 'initializing' },
  setup: async (injector) => {
    await Promise.all([setupIdentity(injector), setupIdentityRestApi(injector)])
  },
}
