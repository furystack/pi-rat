import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { GetDirectoryEntries } from 'common'
import { Drive } from 'common'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { existsAsync } from '../../utils/exists-async.js'
import { direntToApiModel } from '../utils/dirent-to-api-model.js'

export const GetDirectoryEntriesAction: RequestAction<GetDirectoryEntries> = async ({ injector, getUrlParams }) => {
  const { letter, path } = getUrlParams()
  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, letter)
  if (!drive) {
    return JsonResult({ entries: [], count: 0 }, 404)
  }
  const absolutePath = join(drive.physicalPath, path)

  if (!(await existsAsync(absolutePath))) {
    const logger = getLogger(injector).withScope('GetDirectoryEntriesAction')
    await logger.warning({
      message: 'Trying to get directory entries for a non-existing path',
      data: { absolutePath, letter, path },
    })
    throw new RequestError('The path does not exist', 404)
  }

  const entries = await readdir(absolutePath, { withFileTypes: true, encoding: 'utf-8' })

  return JsonResult({
    entries: entries.map(direntToApiModel),
    count: entries.length,
  })
}
