import { Injectable, type Injector } from '@furystack/inject'
import { type InternalAppModel } from '../../AppModelManager.js'
import { InstallManifest } from './install-manifest.js'
import { setupInstallRestApi } from './setup-install-rest-api.js'
import { setupInstall } from './setup-install.js'

@Injectable({ lifetime: 'singleton' })
export class InstallAppModel implements InternalAppModel {
  declare private injector: Injector

  public manifest = InstallManifest

  public state = {
    type: 'initializing' as const,
  }

  public async setup() {
    await Promise.all([setupInstall(this.injector), setupInstallRestApi(this.injector)])
  }
}
