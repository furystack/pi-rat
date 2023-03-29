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
import { Dashboard, dashboardsApiSchema } from 'common'
import { getPort } from '../get-port'
import { getCorsOptions } from '../get-cors-options'

export const setupDashboardsRestApi = async (injector: Injector) => {
  await useRestService<DashboardsApi>({
    injector,
    root: 'api',
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
        // TODO
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        '/dashboards': Validate({ schema: dashboardsApiSchema, schemaName: 'PostDashboardEndpoint' })(
          createPostEndpoint({
            model: Dashboard,
            primaryKey: 'id',
          }),
        ),
      },
      PATCH: {
        // TODO
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
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
