import type { InternalAppModel } from '../../AppModelManager.js'
import { DrivesManifest } from './drives-manifest.js'
import { setupDrivesRestApi } from './setup-drives-rest-api.js'
import { setupDrives } from './setup-drives.js'

export const DrivesAppModel: InternalAppModel = {
  manifest: DrivesManifest,
  state: { type: 'initializing' },
  setup: async (injector) => {
    await Promise.all([setupDrives(injector), setupDrivesRestApi(injector)])
  },
}
