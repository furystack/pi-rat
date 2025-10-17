import { Injectable, type Injector } from '@furystack/inject'
import type { InternalAppModel } from '../../AppModelManager.js'
import { DashboardsManifest } from './dashboards-manifest.js'
import { setupDashboardsRestApi } from './setup-dashboards-rest-api.js'
import { setupDashboards } from './setup-dashboards.js'

@Injectable({ lifetime: 'singleton' })
export class DashboardsAppModel implements InternalAppModel {
  public manifest = DashboardsManifest
  public state = {
    type: 'initializing' as const,
  }

  declare private injector: Injector

  public async setup() {
    await Promise.all([setupDashboards(this.injector), setupDashboardsRestApi(this.injector)])
  }
}
