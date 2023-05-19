import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult, getMimeForFile } from '@furystack/rest-service'
import type { StreamEndpoint } from 'common'
import { MovieFile } from 'common'
import { Drive } from 'common'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { join } from 'path'

export const StreamAction: RequestAction<StreamEndpoint> = async ({ injector, getUrlParams, request, response }) => {
  const { id: movieFileId } = getUrlParams()

  const movieFile = await getDataSetFor(injector, MovieFile, 'id').get(injector, movieFileId)

  if (!movieFile) {
    throw new RequestError(`Movie file with imdbId '${movieFileId}' not found`, 404)
  }

  const { driveLetter, path, fileName } = movieFile

  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, driveLetter)
  if (!drive) {
    throw new RequestError(`Drive ${driveLetter} not found`, 404)
  }

  const fullPath = join(drive.physicalPath, path, fileName)

  const fileStats = await stat(fullPath)
  const fileSize = fileStats.size
  const mime = getMimeForFile(fullPath)
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
