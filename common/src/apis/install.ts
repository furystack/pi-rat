import type { RestApi } from '@furystack/rest'
import type { AppModelManifest } from '../models/app-model/app-model-manifest.js'
import type { AppState } from '../models/app-model/app-state.js'
import type { ServiceStatus } from '../models/install/index.js'

export type ServiceStatusResponse = {
  state: ServiceStatus
  services: {
    /**
     * OMDB API Installation Status for metadata fetching
     */
    omdb: boolean
    /**
     * Github API Installation Status for external authentication
     */
    github: boolean
  }
}

export type GetServiceStatusAction = { result: ServiceStatusResponse }

export type AppModelInfo = {
  manifest: AppModelManifest
  state: AppState
}

export type GetAppModelsAction = { result: AppModelInfo[] }

export type InstallAction = { result: { success: boolean }; body: { username: string; password: string } }

export interface InstallApi extends RestApi {
  GET: {
    '/serviceStatus': GetServiceStatusAction
    '/app-models': GetAppModelsAction
  }
  POST: {
    '/install': InstallAction
  }
}
