import { getDataSetFor } from '@furystack/repository'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { GetDirectoryEntries } from 'common'
import { Drive } from 'common'
import { join } from 'path'
import { readdir } from 'fs/promises'
import type { DirectoryEntry } from 'common/src/models/directory-entry'
import type { Dirent } from 'fs'

const direntToApiModel = (dirent: Dirent): DirectoryEntry => ({
  name: dirent.name,
  isFile: dirent.isFile(),
  isDirectory: dirent.isDirectory(),
  isBlockDevice: dirent.isBlockDevice(),
  isCharacterDevice: dirent.isCharacterDevice(),
  isSymbolicLink: dirent.isSymbolicLink(),
  isFIFO: dirent.isFIFO(),
  isSocket: dirent.isSocket(),
})

export const GetDirectoryEntriesAction: RequestAction<GetDirectoryEntries> = async ({ injector, getUrlParams }) => {
  const { letter, path } = getUrlParams()
  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, letter)
  if (!drive) {
    return JsonResult({ entries: [], count: 0 }, 404)
  }
  console.log({ drive, letter, path })
  const absolutePath = join(drive.physicalPath, path)
  const entries = await readdir(absolutePath, { withFileTypes: true, encoding: 'utf-8' })

  return JsonResult({
    entries: entries.map(direntToApiModel),
    count: entries.length,
  })
}
