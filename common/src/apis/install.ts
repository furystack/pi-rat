import type { RestApi } from '@furystack/rest'
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
    /**
     * Torrent Client Installation Status
     */
    torrent: boolean
  }
}

export type GetServiceStatusAction = { result: ServiceStatusResponse }

export type InstallAction = { result: { success: boolean }; body: { username: string; password: string } }

export interface InstallApi extends RestApi {
  GET: {
    '/serviceStatus': GetServiceStatusAction
  }
  POST: {
    '/install': InstallAction
  }
}
