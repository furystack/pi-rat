import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import { PathHelper } from '@furystack/utils'
import type { SaveTextFileEndpoint } from 'common'
import { Drive } from 'common'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { existsAsync } from '../../utils/exists-async.js'

export const SaveTextFileAction: RequestAction<SaveTextFileEndpoint> = async ({ getUrlParams, getBody, injector }) => {
  const { letter, path } = getUrlParams()

  const dataSet = getDataSetFor(injector, Drive, 'letter')
  const drive = await dataSet.get(injector, letter)

  if (!drive) {
    throw new RequestError(`Drive ${letter} not found`, 404)
  }

  const targetPath = join(drive.physicalPath, PathHelper.getParentPath(path))
  const targetPathExists = await existsAsync(targetPath)
  if (!targetPathExists) {
    throw new RequestError(`Target path ${targetPath} does not exists`, 400)
  }

  const { text } = await getBody()

  await writeFile(join(drive.physicalPath, path), text)

  return JsonResult({ success: true })
}
