import { getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import {
  getFallbackMetadata,
  getFileName,
  isMovieFile,
  isSampleFile,
  MovieFile,
  OmdbMovieMetadata,
  type PiRatFile,
} from 'common'
import { FfprobeService } from '../../ffprobe-service.js'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { announceNewMovie } from './announce-new-movie.js'
import { ensureMovieExists } from './ensure-movie-exists.js'
import { ensureOmdbMovieExists } from './ensure-omdb-movie-exists.js'
import { ensureOmdbSeriesExists } from './ensure-omdb-series-exists.js'

export const linkMovie = async (options: { injector: Injector; file: PiRatFile }) => {
  const logger = getLogger(options.injector).withScope('linkMovie')

  const { injector, file } = options
  const { driveLetter, path } = file
  const fileName = getFileName(file)

  if (!isMovieFile(fileName)) {
    await logger.debug({
      message: `File ${fileName} is not a movie file, skipping link process.`,
      data: { file },
    })
    return { status: 'not-movie-file' } as const
  }

  if (isSampleFile(fileName)) {
    await logger.debug({
      message: `File ${fileName} is a sample file, skipping link process.`,
      data: { file },
    })
    return { status: 'not-movie-file' } as const
  }

  const { title, year, season, episode } = getFallbackMetadata(path)

  const movieFileStore = getStoreManager(injector).getStoreFor(MovieFile, 'id')

  const storedMovieFile = await movieFileStore.find({
    filter: {
      driveLetter: { $eq: driveLetter },
      path: { $eq: path },
    },
  })

  if (storedMovieFile.length > 0) {
    await logger.debug({
      message: `File ${fileName} is already linked to a movie file.`,
      data: { file, storedMovieFile },
    })
    return { status: 'already-linked' } as const
  }

  const ffprobeResult = await injector.getInstance(FfprobeService).getFfprobeForPiratFile(file)

  const omdbStore = getStoreManager(injector).getStoreFor(OmdbMovieMetadata, 'imdbID')
  const storedResult = await omdbStore.find({
    filter: {
      Title: { $eq: title },
      ...(year ? { Year: { $eq: year.toString() } } : {}),
      ...(season ? { Season: { $eq: season.toString() } } : {}),
      ...(episode ? { Episode: { $eq: episode.toString() } } : {}),
    },
    top: 2,
  })

  if (storedResult.length > 1) {
    throw new RequestError('Multiple results found', 400)
  }

  if (storedResult.length === 1) {
    const movie = await ensureMovieExists(storedResult[0], injector)
    await ensureOmdbSeriesExists(storedResult[0], injector)

    const {
      created: [newMovieFile],
    } = await movieFileStore.add({
      driveLetter,
      path,
      imdbId: storedResult[0].imdbID,
      ffprobe: ffprobeResult,
    })

    await announceNewMovie({
      injector,
      file: {
        driveLetter,
        path,
      },

      movie,
      movieFile: newMovieFile,
    })

    await logger.debug({
      message: `File ${fileName} linked succesfully.`,
      data: { file, movieFile: newMovieFile, movie },
    })

    return { status: 'linked', movieFile: newMovieFile, movie } as const
  }

  const omdbClientService = injector.getInstance(OmdbClientService)
  const result = await omdbClientService.fetchOmdbMovieMetadata({
    title,
    year,
    season,
    episode,
  })

  if (!result) {
    throw new RequestError('Metadata not found', 404)
  }

  const added = await ensureOmdbMovieExists(result, injector)

  const movie = await ensureMovieExists(added, injector)
  await ensureOmdbSeriesExists(added, injector)

  const {
    created: [newMovieFile],
  } = await movieFileStore.add({
    driveLetter,
    path,
    imdbId: added.imdbID,
    ffprobe: ffprobeResult,
  })

  await announceNewMovie({
    injector,
    file: { driveLetter, path },
    movie,
    movieFile: newMovieFile,
  })

  return { status: 'linked' } as const
}
