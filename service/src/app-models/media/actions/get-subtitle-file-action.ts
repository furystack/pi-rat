import { DriveDataSet } from '../../drives/setup-drives.js'
import { MovieFileDataSet } from '../media-data-sets.js'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { MediaApi } from 'common'
import { getFileName, getParentPath } from 'common'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { resolve, relative } from 'path'

type GetSubtitleFileEndpoint = MediaApi['GET']['/movies/:movieId/subtitles/:subtitleName']

export const GetSubtitleFileAction: RequestAction<GetSubtitleFileEndpoint> = async ({
  injector,
  getUrlParams,
  response,
}) => {
  const logger = getLogger(injector).withScope('GetSubtitleFileAction')
  const { movieId, subtitleName } = getUrlParams()

  const movieFiles = await getDataSetFor(injector, MovieFileDataSet).find(injector, {
    filter: { imdbId: { $eq: movieId } },
  })

  if (movieFiles.length === 0) {
    throw new RequestError('No movie files found for this movie', 404)
  }

  for (const movieFile of movieFiles) {
    const drive = await getDataSetFor(injector, DriveDataSet).get(injector, movieFile.driveLetter)
    if (!drive) continue

    const parentPath = getParentPath({ driveLetter: movieFile.driveLetter, path: movieFile.path })
    const physicalParent = resolve(drive.physicalPath, parentPath)
    const subtitlePath = resolve(physicalParent, subtitleName)

    const rel = relative(physicalParent, subtitlePath)
    if (rel.startsWith('..') || resolve(subtitlePath) !== subtitlePath) {
      throw new RequestError('Invalid subtitle path', 400)
    }

    try {
      const fileStat = await stat(subtitlePath)
      const contentType = subtitleName.endsWith('.vtt') ? 'text/vtt' : 'text/plain'

      response.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': fileStat.size,
        'Cache-Control': 'public, max-age=86400',
      })
      createReadStream(subtitlePath, { autoClose: true }).pipe(response)

      await logger.verbose({ message: `Serving subtitle file: ${subtitleName}` })
      return BypassResult()
    } catch {
      continue
    }
  }

  const fileName = getFileName({ driveLetter: movieFiles[0].driveLetter, path: movieFiles[0].path })
  throw new RequestError(`Subtitle file '${subtitleName}' not found for movie file '${fileName}'`, 404)
}
