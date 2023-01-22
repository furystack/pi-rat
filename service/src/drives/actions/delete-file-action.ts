import { isAuthorized } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { DeleteFileEndpoint } from 'common'
import { Drive } from 'common'
import { unlink } from 'fs/promises'
import { join } from 'path'

export const DeleteFileAction: RequestAction<DeleteFileEndpoint> = async ({ injector, getUrlParams }) => {
  if (!isAuthorized(injector, 'admin')) {
    throw new RequestError('Unauthorized', 401)
  }
  const { letter, path } = getUrlParams()
  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, letter)

  if (!drive) {
    throw new RequestError('Drive not found', 404)
  }

  const fullPath = join(drive.physicalPath, path)
  await unlink(fullPath)
  return JsonResult({ success: true })
}
