import type { InternalAppModel } from '../../AppModelManager.js'
import { InstallManifest } from './install-manifest.js'
import { setupInstallRestApi } from './setup-install-rest-api.js'
import { setupInstall } from './setup-install.js'

export const InstallAppModel: InternalAppModel = {
  manifest: InstallManifest,
  state: { type: 'initializing' },
  setup: async (injector) => {
    await Promise.all([setupInstall(injector), setupInstallRestApi(injector)])
  },
}
