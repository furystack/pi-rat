import type { Injector } from '@furystack/inject'
import {
  Validate,
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
} from '@furystack/rest-service'
import type { DashboardsApi } from 'common'
import { Dashboard } from 'common'
import dashboardsApiSchema from 'common/schemas/dashboards-api.json' assert { type: 'json' }
import { getPort } from '../get-port.js'
import { getCorsOptions } from '../get-cors-options.js'

export const setupDashboardsRestApi = async (injector: Injector) => {
  await useRestService<DashboardsApi>({
    injector,
    root: 'api/dashboards',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/dashboards': Validate({ schema: dashboardsApiSchema, schemaName: 'GetCollectionEndpoint<Dashboard>' })(
          createGetCollectionEndpoint({
            model: Dashboard,
            primaryKey: 'id',
          }),
        ),
        '/dashboards/:id': Validate({ schema: dashboardsApiSchema, schemaName: 'GetEntityEndpoint<Dashboard,"id">' })(
          createGetEntityEndpoint({
            model: Dashboard,
            primaryKey: 'id',
          }),
        ),
      },
      POST: {
        '/dashboards': Validate({ schema: dashboardsApiSchema, schemaName: 'PostDashboardEndpoint' })(
          createPostEndpoint({
            model: Dashboard,
            primaryKey: 'id',
          }),
        ),
      },
      PATCH: {
        '/dashboards/:id': Validate({ schema: dashboardsApiSchema, schemaName: 'PatchDashboardEndpoint' })(
          createPatchEndpoint({
            model: Dashboard,
            primaryKey: 'id',
          }),
        ),
      },
      DELETE: {
        '/dashboards/:id': Validate({ schema: dashboardsApiSchema, schemaName: 'DeleteEndpoint<Dashboard,"id">' })(
          createDeleteEndpoint({
            model: Dashboard,
            primaryKey: 'id',
          }),
        ),
      },
    },
  })
}
