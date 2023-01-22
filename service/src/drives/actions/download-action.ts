import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult, getMimeForFile } from '@furystack/rest-service'
import type { DownloadEndpoint } from 'common'
import { Drive } from 'common'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { join } from 'path'

export const DownloadAction: RequestAction<DownloadEndpoint> = async ({
  injector,
  getUrlParams,
  request,
  response,
}) => {
  const { letter, path } = getUrlParams()

  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, letter)
  if (!drive) {
    throw new RequestError(`Drive ${letter} not found`, 404)
  }

  const fullPath = join(drive.physicalPath, path)

  const fileStats = await stat(fullPath)
  const fileSize = fileStats.size
  const mime = getMimeForFile(path)
  const { range } = request.headers
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunksize = end - start + 1
    const file = createReadStream(fullPath, { start, end, autoClose: true })
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mime,
    }

    response.writeHead(206, head)
    file.pipe(response)
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': mime,
    }
    response.writeHead(200, head)
    createReadStream(fullPath, { autoClose: true }).pipe(response)
  }
  return BypassResult()
}
