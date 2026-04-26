import { DriveDataSet } from '../../drives/setup-drives.js'
import { MovieFileDataSet } from '../media-data-sets.js'
import { useSystemIdentityContext } from '@furystack/core'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { createScanProgress, getProcessedCount, updateScanProgress, type ScanForMoviesEndpoint } from 'common'
import { MovieMaintainerService } from '../services/movie-file-maintainer.js'
import { extractSubtitles } from '../utils/extract-subtitles.js'
import { linkMovie } from '../utils/link-movie.js'

const PROGRESS_LOG_INTERVAL = 50

export const ScanForMoviesAction: RequestAction<ScanForMoviesEndpoint> = async ({ injector, getBody }) => {
  const { root, autoExtractSubtitles } = await getBody()

  const logger = getLogger(injector).withScope('ScanForMoviesAction')
  const systemInjector = useSystemIdentityContext({ injector, username: 'scan-movies' })

  const maintainer = injector.get(MovieMaintainerService)
  const driveDataSet = getDataSetFor(injector, DriveDataSet)
  const drive = await driveDataSet.get(systemInjector, root.driveLetter)

  if (!drive) {
    throw new RequestError(`Drive ${root.driveLetter} not found`, 400)
  }

  const movieFileDataSet = getDataSetFor(injector, MovieFileDataSet)
  const alreadyAddedMovieFiles = await movieFileDataSet.find(systemInjector, {})

  await logger.verbose({
    message: `Scanning for movie files in ${root.path} on drive ${drive.letter}`,
    data: { root, autoExtractSubtitles },
  })

  const toBeAdded = (await maintainer.checkFolderForPossibleMovieFiles(root.path, drive, alreadyAddedMovieFiles)).flat()

  await logger.information({
    message: `Found ${toBeAdded.length} movie files to be added`,
    data: { count: toBeAdded.length },
  })

  const progress = createScanProgress(toBeAdded.length)

  const added: Array<Awaited<ReturnType<typeof linkMovie>>> = []
  for (const file of toBeAdded) {
    try {
      const result = await linkMovie({
        injector: systemInjector,
        file,
      })

      if (result.status === 'linked' && autoExtractSubtitles) {
        await extractSubtitles({
          injector: systemInjector,
          file,
        })
      }
      added.push(result)
      updateScanProgress(progress, result.status)
    } catch (error) {
      await logger.error({
        message: `Error linking movie file '${file.driveLetter}:${file.path}'`,
        data: { file, error },
      })
      updateScanProgress(progress, 'failed')
    }

    const processed = getProcessedCount(progress)
    if (processed > 0 && processed % PROGRESS_LOG_INTERVAL === 0) {
      await logger.information({
        message: `Scan progress: ${processed}/${progress.total}`,
        data: { progress },
      })
    }
  }

  await logger.information({
    message: `Scan finished.`,
    data: { progress },
  })

  return JsonResult({
    added: added.filter((file) => file.status === 'linked').map((file) => file.movieFile),
    progress,
  })
}
