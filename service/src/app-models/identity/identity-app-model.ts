import { Injectable, type Injector } from '@furystack/inject'
import type { InternalAppModel } from '../../AppModelManager.js'
import { IdentityManifest } from './identity-manifest.js'
import { setupIdentityRestApi } from './setup-identity-rest-api.js'
import { setupIdentity } from './setup-identity-store.js'

@Injectable({ lifetime: 'singleton' })
export class IdentityAppModel implements InternalAppModel {
  declare private injector: Injector
  public async setup() {
    await Promise.all([setupIdentity(this.injector), setupIdentityRestApi(this.injector)])
  }
  public state = { type: 'initializing' as const }
  public manifest = IdentityManifest
}
