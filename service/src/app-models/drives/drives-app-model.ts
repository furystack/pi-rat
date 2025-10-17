import { Injectable, type Injector } from '@furystack/inject'
import type { InternalAppModel } from '../../AppModelManager.js'
import { DrivesManifest } from './drives-manifest.js'
import { setupDrivesRestApi } from './setup-drives-rest-api.js'
import { setupDrives } from './setup-drives.js'

@Injectable({ lifetime: 'singleton' })
export class DrivesAppModel implements InternalAppModel {
  manifest = DrivesManifest
  state = {
    type: 'initializing' as const,
  }
  declare private injector: Injector

  public async setup() {
    await Promise.all([setupDrives(this.injector), setupDrivesRestApi(this.injector)])
  }
}
