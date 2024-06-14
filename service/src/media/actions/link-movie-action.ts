import { getStoreManager, isAuthorized } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { LinkMovie, PiRatFile } from 'common'
import {
  Movie,
  MovieFile,
  OmdbMovieMetadata,
  OmdbSeriesMetadata,
  Series,
  getFallbackMetadata,
  getFileName,
  isMovieFile,
  isSampleFile,
} from 'common'
import { FfprobeService } from '../../ffprobe-service.js'
import { WebsocketService } from '../../websocket-service.js'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { extractSubtitles } from '../utils/extract-subtitles.js'

const ensureMovieExists = async (omdbMeta: OmdbMovieMetadata, injector: Injector) => {
  const movieStore = getStoreManager(injector).getStoreFor(Movie, 'imdbId')
  const existingMovie = await movieStore.get(omdbMeta.imdbID)

  if (!existingMovie) {
    const {
      created: [newMovie],
    } = await movieStore.add({
      imdbId: omdbMeta.imdbID,
      title: omdbMeta.Title,
      year: parseInt(omdbMeta.Year, 10),
      season: omdbMeta.Season ? parseInt(omdbMeta.Season, 10) : undefined,
      episode: omdbMeta.Episode ? parseInt(omdbMeta.Episode, 10) : undefined,
      type: omdbMeta.Type,
      duration: omdbMeta.Runtime ? parseInt(omdbMeta.Runtime, 10) : undefined,
      thumbnailImageUrl: omdbMeta.Poster,
      plot: omdbMeta.Plot,
      seriesId: omdbMeta.seriesID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return newMovie
  }
  return existingMovie
}

const ensureOmdbMovieExists = async (omdbMeta: OmdbMovieMetadata, injector: Injector) => {
  const store = await getStoreManager(injector).getStoreFor(OmdbMovieMetadata, 'imdbID')
  const existing = await store.get(omdbMeta.imdbID)
  if (existing) {
    return existing
  }
  const {
    created: [added],
  } = await store.add(omdbMeta)
  return added
}

const ensureSeriesExists = async (omdbMeta: OmdbSeriesMetadata, injector: Injector) => {
  const seriesStore = getStoreManager(injector).getStoreFor(Series, 'imdbId')
  const existingSeries = await seriesStore.get(omdbMeta.imdbID)

  if (!existingSeries) {
    await seriesStore.add({
      imdbId: omdbMeta.imdbID,
      title: omdbMeta.Title,
      year: omdbMeta.Year,
      thumbnailImageUrl: omdbMeta.Poster,
      plot: omdbMeta.Plot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
}

const ensureOmdbSeriesExists = async (omdbMeta: OmdbMovieMetadata, injector: Injector) => {
  if (!omdbMeta.seriesID) {
    return
  }

  const omdbSeriesStore = getStoreManager(injector).getStoreFor(OmdbSeriesMetadata, 'imdbID')
  const storedResult = await omdbSeriesStore.get(omdbMeta.seriesID)
  if (!storedResult) {
    const omdbClientService = injector.getInstance(OmdbClientService)
    const result = await omdbClientService.fetchOmdbSeriesMetadata({
      imdbId: omdbMeta.seriesID,
    })
    if (!result) {
      throw new RequestError('Metadata not found', 404)
    }
    const {
      created: [newAdded],
    } = await omdbSeriesStore.add(result)
    await ensureSeriesExists(newAdded, injector)
  } else {
    await ensureSeriesExists(storedResult, injector)
  }
}

const announceNewMovie = async ({
  injector,
  file,
  movie,
  movieFile,
}: {
  injector: Injector
  file: PiRatFile
  movie: Movie
  movieFile: MovieFile
}) => {
  injector
    .getInstance(WebsocketService)
    .announce({ type: 'add-movie', file, movie, movieFile }, async ({ injector: i }) => isAuthorized(i, 'admin'))
}

export const linkMovie = async (options: { injector: Injector; file: PiRatFile }) => {
  const { injector } = options
  const { driveLetter, path } = options.file
  const fileName = getFileName(options.file)

  if (!isMovieFile(fileName)) {
    return { status: 'not-movie-file' } as const
  }

  if (isSampleFile(fileName)) {
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
    return { status: 'already-linked' } as const
  }

  const ffprobeResult = await injector.getInstance(FfprobeService).getFfprobeForPiratFile(options.file)

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

    announceNewMovie({
      injector,
      file: {
        driveLetter,
        path,
      },

      movie,
      movieFile: newMovieFile,
    })

    return { status: 'linked' } as const
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

  await extractSubtitles({ injector, file: { driveLetter, path } })

  announceNewMovie({
    injector,
    file: { driveLetter, path },
    movie,
    movieFile: newMovieFile,
  })

  return { status: 'linked' } as const
}

export const LinkMovieAction: RequestAction<LinkMovie> = async ({ getBody, injector }) => {
  const file = await getBody()

  const result = await linkMovie({ injector, file })

  return JsonResult(result)
}
