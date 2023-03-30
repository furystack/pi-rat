import { StoreManager } from '@furystack/core'
import type { Patch } from './patch'
import { Dashboard } from 'common'

export const addDefaultDashboardPatcher: Patch = {
  id: '002-add-default-dashboard',
  description: 'Adds a default dashboard to the Dashboards DB',
  name: 'Add default dashboard',
  run: async (injector, addLogEntry) => {
    const dashboardStore = injector.getInstance(StoreManager).getStoreFor<Dashboard, 'id'>(Dashboard, 'id')

    await dashboardStore.add({
      name: 'Default',
      description: 'Default',
      owner: 'system',
      widgets: [
        {
          type: 'group',
          title: 'Apps',
          widgets: [
            {
              type: 'app-shortcut',
              appName: 'home',
            },
            {
              type: 'app-shortcut',
              appName: 'browser',
            },
          ],
        },
        {
          type: 'group',
          title: 'Entities',
          widgets: [
            {
              type: 'entity-shortcut',
              entityName: 'dasboard',
            },
            {
              type: 'entity-shortcut',
              entityName: 'drive',
            },
            {
              type: 'entity-shortcut',
              entityName: 'user',
            },
          ],
        },
      ],
    } as Dashboard)
    addLogEntry('Initializing Patcher Service Initializer Patch')
  },
}
