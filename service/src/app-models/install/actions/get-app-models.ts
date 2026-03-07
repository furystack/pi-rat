import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { GetAppModelsAction } from 'common'
import { AppModelManager } from '../../../AppModelManager.js'

export const GetAppModels: RequestAction<GetAppModelsAction> = async ({ injector }) => {
  const appModelManager = injector.getInstance(AppModelManager)
  const result = [...appModelManager.appModels.values()].map((am) => ({
    manifest: am.manifest,
    state: am.state,
  }))

  return JsonResult(result)
}
