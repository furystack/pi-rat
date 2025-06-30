import { getStoreManager } from '@furystack/core'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { Drive, MovieFile, type ScanForMoviesEndpoint } from 'common'
import { MovieMaintainerService } from '../services/movie-file-maintainer.js'
import { extractSubtitles } from '../utils/extract-subtitles.js'
import { linkMovie } from '../utils/link-movie.js'

export const ScanForMoviesAction: RequestAction<ScanForMoviesEndpoint> = async ({ injector, getBody }) => {
  const { root, autoExtractSubtitles } = await getBody()

  const maintainer = injector.getInstance(MovieMaintainerService)
  const storeManager = getStoreManager(injector)
  const driveStore = storeManager.getStoreFor(Drive, 'letter')
  const drive = await driveStore.get(root.driveLetter)

  if (!drive) {
    throw new RequestError(`Drive ${root.driveLetter} not found`, 400)
  }

  const movieFilesStore = storeManager.getStoreFor(MovieFile, 'id')

  const alreadyAddedMovieFiles = await movieFilesStore.find({})

  const toBeAdded = (await maintainer.checkFolderForPossibleMovieFiles(root.path, drive, alreadyAddedMovieFiles)).flat()

  const added = await Promise.all(
    toBeAdded.map(async (file) => {
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
      return addedMovieFile
    }),
  )

  return JsonResult({
    status: true,
    added: added.filter((file) => file.status === 'linked').map((file) => file.movieFile!),
  })
}
