import { getStoreManager } from '@furystack/core'
import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { Drive, MovieFile, type ScanForMoviesEndpoint } from 'common'
import { MovieMaintainerService } from '../services/movie-file-maintainer.js'
import { extractSubtitles } from '../utils/extract-subtitles.js'
import { linkMovie } from '../utils/link-movie.js'

export const ScanForMoviesAction: RequestAction<ScanForMoviesEndpoint> = async ({ injector, getBody }) => {
  const { root, autoExtractSubtitles } = await getBody()

  const logger = getLogger(injector).withScope('ScanForMoviesAction')

  const maintainer = injector.getInstance(MovieMaintainerService)
  const storeManager = getStoreManager(injector)
  const driveStore = storeManager.getStoreFor(Drive, 'letter')
  const drive = await driveStore.get(root.driveLetter)

  if (!drive) {
    throw new RequestError(`Drive ${root.driveLetter} not found`, 400)
  }

  const movieFilesStore = storeManager.getStoreFor(MovieFile, 'id')
  const alreadyAddedMovieFiles = await movieFilesStore.find({})

  await logger.verbose({
    message: `Scanning for movie files in ${root.path} on drive ${drive.letter}`,
    data: { root, autoExtractSubtitles },
  })

  const toBeAdded = (await maintainer.checkFolderForPossibleMovieFiles(root.path, drive, alreadyAddedMovieFiles)).flat()

  await logger.verbose({
    message: `Found ${toBeAdded.length} movie files to be added`,
    data: { toBeAdded },
  })

  const added: Array<Awaited<ReturnType<typeof linkMovie>>> = []
  for (const file of toBeAdded) {
    try {
      const addedMovieFile = await linkMovie({
        injector,
        file,
      })

      if (autoExtractSubtitles) {
        await extractSubtitles({
          injector,
          file,
        })
      }
      added.push(addedMovieFile)
    } catch (error) {
      await logger.error({
        message: `Error linking movie file ${file.path}`,
        data: { file, error },
      })
    }
  }

  return JsonResult({
    status: true,
    added: added.filter((file) => file.status === 'linked').map((file) => file.movieFile!),
  })
}
