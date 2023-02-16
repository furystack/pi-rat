import type { Injector } from '@furystack/inject'
import { useRestService } from '@furystack/rest-service'

export const SetupWebTorrentRestApi = async (injector: Injector) => {
  useRestService<WebTorrentApi>({})
}
