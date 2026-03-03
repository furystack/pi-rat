import { useSystemIdentityContext } from '@furystack/core'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { Drive, MovieFile, type ScanForMoviesEndpoint, type ScanProgress } from 'common'
import { MovieMaintainerService } from '../services/movie-file-maintainer.js'
import { extractSubtitles } from '../utils/extract-subtitles.js'
import { linkMovie } from '../utils/link-movie.js'

const PROGRESS_LOG_INTERVAL = 50

export const ScanForMoviesAction: RequestAction<ScanForMoviesEndpoint> = async ({ injector, getBody }) => {
  const { root, autoExtractSubtitles } = await getBody()

  const logger = getLogger(injector).withScope('ScanForMoviesAction')
  const systemInjector = useSystemIdentityContext({ injector, username: 'scan-movies' })

  const maintainer = injector.getInstance(MovieMaintainerService)
  const driveDataSet = getDataSetFor(injector, Drive, 'letter')
  const drive = await driveDataSet.get(systemInjector, root.driveLetter)

  if (!drive) {
    throw new RequestError(`Drive ${root.driveLetter} not found`, 400)
  }

  const movieFileDataSet = getDataSetFor(injector, MovieFile, 'id')
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

  const progress: ScanProgress = {
    total: toBeAdded.length,
    linked: 0,
    alreadyLinked: 0,
    failed: 0,
    rateLimited: 0,
    metadataNotFound: 0,
    skipped: 0,
  }

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
      updateProgress(progress, result.status)
    } catch (error) {
      await logger.error({
        message: `Error linking movie file '${file.driveLetter}:${file.path}'`,
        data: { file, error },
      })
      progress.failed++
    }

    const processed =
      progress.linked +
      progress.alreadyLinked +
      progress.failed +
      progress.rateLimited +
      progress.metadataNotFound +
      progress.skipped
    if (processed % PROGRESS_LOG_INTERVAL === 0) {
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
    status: true,
    added: added.filter((file) => file.status === 'linked').map((file) => file.movieFile),
    progress,
  })
}

const updateProgress = (progress: ScanProgress, status: string) => {
  switch (status) {
    case 'linked':
      progress.linked++
      break
    case 'already-linked':
      progress.alreadyLinked++
      break
    case 'rate-limited':
      progress.rateLimited++
      break
    case 'metadata-not-found':
      progress.metadataNotFound++
      break
    default:
      progress.skipped++
      break
  }
}
