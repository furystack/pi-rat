import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { InstallAction } from 'common'
import { ServiceStatusProvider } from '../service-installer'

export const PostInstallAction: RequestAction<InstallAction> = async ({ injector, getBody }) => {
  const { username, password } = await getBody()
  const provider = injector.getInstance(ServiceStatusProvider)
  await provider.install(username, password)
  return JsonResult({
    success: true,
  })
}
