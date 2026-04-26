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
import dashboardsApiSchema from 'common/schemas/dashboards-api.json' with { type: 'json' }
import { getCorsOptions } from '../../get-cors-options.js'
import { getPort } from '../../get-port.js'
import { DashboardDataSet } from './setup-dashboards.js'

export const setupDashboardsRestApi = async (injector: Injector) => {
  await useRestService<DashboardsApi>({
    injector,
    root: 'api/dashboards',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/dashboards': Validate({ schema: dashboardsApiSchema, schemaName: 'GetCollectionEndpoint<Dashboard>' })(
          createGetCollectionEndpoint(DashboardDataSet),
        ),
        '/dashboards/:id': Validate({ schema: dashboardsApiSchema, schemaName: 'GetEntityEndpoint<Dashboard,"id">' })(
          createGetEntityEndpoint(DashboardDataSet),
        ),
      },
      POST: {
        '/dashboards': Validate({ schema: dashboardsApiSchema, schemaName: 'PostDashboardEndpoint' })(
          createPostEndpoint(DashboardDataSet),
        ),
      },
      PATCH: {
        '/dashboards/:id': Validate({ schema: dashboardsApiSchema, schemaName: 'PatchDashboardEndpoint' })(
          createPatchEndpoint(DashboardDataSet),
        ),
      },
      DELETE: {
        '/dashboards/:id': Validate({ schema: dashboardsApiSchema, schemaName: 'DeleteEndpoint<Dashboard,"id">' })(
          createDeleteEndpoint(DashboardDataSet),
        ),
      },
    },
  })
}
