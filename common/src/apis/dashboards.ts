import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'
import type { Dashboard } from '../models/dashboard/index.js'
import type { WithOptionalId } from '@furystack/core'

type PostDashboardEndpoint = PostEndpoint<
  Dashboard,
  'id',
  Omit<WithOptionalId<Dashboard, 'id'>, 'createdAt' | 'updatedAt'>
>

type PatchDashboardEndpoint = PatchEndpoint<
  Dashboard,
  'id',
  Omit<WithOptionalId<Dashboard, 'id'>, 'createdAt' | 'updatedAt'>
>

export interface DashboardsApi extends RestApi {
  GET: {
    '/dashboards': GetCollectionEndpoint<Dashboard>
    '/dashboards/:id': GetEntityEndpoint<Dashboard, 'id'>
  }
  POST: {
    '/dashboards': PostDashboardEndpoint
  }
  PATCH: {
    '/dashboards/:id': PatchDashboardEndpoint
  }
  DELETE: {
    '/dashboards/:id': DeleteEndpoint<Dashboard, 'id'>
  }
}
