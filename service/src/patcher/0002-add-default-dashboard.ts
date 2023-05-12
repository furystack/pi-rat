import { StoreManager } from '@furystack/core'
import type { Patch } from './patch.js'
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
          title: 'Main Entities',
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
        {
          type: 'group',
          title: 'Media Entities',
          widgets: [
            {
              type: 'entity-shortcut',
              entityName: 'movie',
            },
            {
              type: 'entity-shortcut',
              entityName: 'movie-file',
            },
            {
              type: 'entity-shortcut',
              entityName: 'omdb-movie-metadata',
            },
            {
              type: 'entity-shortcut',
              entityName: 'omdb-series-metadata',
            },
          ],
        },
      ],
    } as Dashboard)
    addLogEntry('Initializing Patcher Service Initializer Patch')
  },
}
