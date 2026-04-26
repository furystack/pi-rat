import { getDataSetFor } from '@furystack/repository'
import type { Dashboard } from 'common'
import { DashboardDataSet } from '../app-models/dashboards/setup-dashboards.js'
import type { Patch } from './patch.js'

export const addDefaultDashboardPatcher: Patch = {
  id: '002-add-default-dashboard',
  description: 'Adds a default dashboard to the Dashboards DB',
  name: 'Add default dashboard',
  run: async (injector, addLogEntry) => {
    const dashboardDataSet = getDataSetFor(injector, DashboardDataSet)

    await dashboardDataSet.add(injector, {
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
            {
              type: 'app-shortcut',
              appName: 'movies',
            },
            {
              type: 'app-shortcut',
              appName: 'logging-terminal',
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
            {
              type: 'entity-shortcut',
              entityName: 'config',
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
