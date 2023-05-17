import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { LinkMovie } from 'common'
import { OmdbSeriesMetadata, Series } from 'common'
import { MovieFile } from 'common'
import { getFallbackMetadata } from 'common'
import { Movie } from 'common'
import { OmdbMovieMetadata } from 'common'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { RequestError } from '@furystack/rest'
import { getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { extractSubtitles } from '../utils/extract-subtitles.js'

const ensureMovieExists = async (omdbMeta: OmdbMovieMetadata, injector: Injector) => {
  const movieStore = getStoreManager(injector).getStoreFor(Movie, 'imdbId')
  const existingMovie = await movieStore.get(omdbMeta.imdbID)

  if (!existingMovie) {
    await movieStore.add({
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
  }
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

export const LinkMovieAction: RequestAction<LinkMovie> = async ({ getBody, injector }) => {
  const { drive, fileName, path } = await getBody()

  const { title, year, season, episode } = getFallbackMetadata(`${path}/${fileName}`)

  const movieFileStore = getStoreManager(injector).getStoreFor(MovieFile, 'imdbId')

  const storedMovieFile = await movieFileStore.find({
    filter: {
      driveLetter: { $eq: drive },
      path: { $eq: path },
    },
  })

  if (storedMovieFile.length > 0) {
    return JsonResult({ status: 'already-linked' })
  }

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
    await ensureMovieExists(storedResult[0], injector)
    await ensureOmdbSeriesExists(storedResult[0], injector)

    await movieFileStore.add({
      driveLetter: drive,
      path,
      fileName,
      imdbId: storedResult[0].imdbID,
    })

    return JsonResult({ status: 'linked' })
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

  await ensureMovieExists(added, injector)
  await ensureOmdbSeriesExists(added, injector)

  await movieFileStore.add({
    driveLetter: drive,
    path,
    fileName,
    imdbId: added.imdbID,
  })

  await extractSubtitles({ driveLetter: drive, path, fileName, injector })

  return JsonResult({ status: 'linked' })
}
