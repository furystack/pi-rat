import { DriveDataSet } from '../../drives/setup-drives.js'
import { MovieFileDataSet } from '../media-data-sets.js'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { MediaApi } from 'common'
import { getFileName, getParentPath } from 'common'
import { promises } from 'fs'
import { join } from 'path'

type GetSubtitlesEndpoint = MediaApi['GET']['/movies/:movieId/subtitles']

export const GetSubtitlesAction: RequestAction<GetSubtitlesEndpoint> = async ({ injector, getUrlParams }) => {
  const logger = getLogger(injector).withScope('GetSubtitlesAction')
  const { movieId } = getUrlParams()

  const movieFiles = await getDataSetFor(injector, MovieFileDataSet).find(injector, {
    filter: { imdbId: { $eq: movieId } },
  })

  if (movieFiles.length === 0) {
    throw new RequestError('No movie files found for this movie', 404)
  }

  const subtitleNames: string[] = []

  for (const movieFile of movieFiles) {
    const drive = await getDataSetFor(injector, DriveDataSet).get(injector, movieFile.driveLetter)
    if (!drive) continue

    const parentPath = getParentPath({ driveLetter: movieFile.driveLetter, path: movieFile.path })
    const physicalParent = join(drive.physicalPath, parentPath)
    const fileName = getFileName({ driveLetter: movieFile.driveLetter, path: movieFile.path })

    try {
      const entries = await promises.readdir(physicalParent)
      const vttFiles = entries.filter((entry) => entry.startsWith(fileName) && entry.endsWith('.vtt'))
      subtitleNames.push(...vttFiles)
    } catch {
      await logger.verbose({ message: `Could not read directory ${physicalParent}` })
    }

    if (movieFile.relatedFiles) {
      for (const related of movieFile.relatedFiles.filter((r) => r.type === 'subtitle')) {
        const name = related.path.split('/').pop()
        if (name && !subtitleNames.includes(name)) {
          subtitleNames.push(name)
        }
      }
    }
  }

  return JsonResult(subtitleNames)
}
