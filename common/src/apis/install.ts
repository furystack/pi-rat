import type { RestApi } from '@furystack/rest'
import type { ServiceStatus } from '../models'

export type GetServiceStatusAction = { result: { state: ServiceStatus } }

export type InstallAction = { result: { success: boolean }; body: { username: string; password: string } }

export interface InstallApi extends RestApi {
  GET: {
    '/serviceStatus': GetServiceStatusAction
  }
  POST: {
    '/install': InstallAction
  }
}
