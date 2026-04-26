import type { InternalAppModel } from '../../AppModelManager.js'
import { DashboardsManifest } from './dashboards-manifest.js'
import { setupDashboardsRestApi } from './setup-dashboards-rest-api.js'
import { setupDashboards } from './setup-dashboards.js'

export const DashboardsAppModel: InternalAppModel = {
  manifest: DashboardsManifest,
  state: { type: 'initializing' },
  setup: async (injector) => {
    await Promise.all([setupDashboards(injector), setupDashboardsRestApi(injector)])
  },
}
