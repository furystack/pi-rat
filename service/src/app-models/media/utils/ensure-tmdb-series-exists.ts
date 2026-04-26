import { TmdbSeriesMetadataDataSet } from '../media-data-sets.js'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { type PiRatFile } from 'common'

import type { TmdbTvDetailsResponse } from '../metadata-services/tmdb-api-types.js'
import { TmdbClientService } from '../metadata-services/tmdb-client-service.js'
import { ensureSeriesExists } from './ensure-series-exists.js'
import { ensureSeriesLocalizedMetadataExists } from './ensure-localized-metadata-exists.js'
import { mapTmdbSeriesToLocalized } from './map-tmdb-to-localized.js'

const storeTmdbSeriesMetadata = async (
  tmdbSeries: TmdbTvDetailsResponse,
  imdbId: string,
  language: string,
  injector: Injector,
) => {
  const dataSet = getDataSetFor(injector, TmdbSeriesMetadataDataSet)
  const existing = await dataSet.get(injector, tmdbSeries.id)
  if (existing) return existing

  const {
    created: [added],
  } = await dataSet.add(injector, {
    id: tmdbSeries.id,
    imdbId,
    name: tmdbSeries.name,
    originalName: tmdbSeries.original_name,
    overview: tmdbSeries.overview,
    firstAirDate: tmdbSeries.first_air_date || undefined,
    posterPath: tmdbSeries.poster_path ?? undefined,
    backdropPath: tmdbSeries.backdrop_path ?? undefined,
    genres: tmdbSeries.genres,
    voteAverage: tmdbSeries.vote_average,
    voteCount: tmdbSeries.vote_count,
    numberOfSeasons: tmdbSeries.number_of_seasons,
    numberOfEpisodes: tmdbSeries.number_of_episodes,
    status: tmdbSeries.status || undefined,
    originalLanguage: tmdbSeries.original_language,
    languages: tmdbSeries.languages,
    language,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return added
}

/**
 * Given an IMDB series ID from a TMDB episode result, fetches and stores the series data via TMDB.
 */
export const ensureTmdbSeriesExists = async (
  seriesImdbId: string,
  tmdbSeriesData: TmdbTvDetailsResponse | undefined,
  language: string,
  injector: Injector,
  context?: { file?: PiRatFile },
) => {
  if (tmdbSeriesData) {
    await storeTmdbSeriesMetadata(tmdbSeriesData, seriesImdbId, language, injector)
    await ensureSeriesExists(
      {
        imdbId: seriesImdbId,
        year: tmdbSeriesData.first_air_date?.slice(0, 4) ?? '',
        numberOfSeasons: tmdbSeriesData.number_of_seasons,
      },
      injector,
    )
    await ensureSeriesLocalizedMetadataExists(
      mapTmdbSeriesToLocalized(tmdbSeriesData, seriesImdbId, language),
      injector,
    )
    return
  }

  const tmdbClientService = injector.get(TmdbClientService)
  const result = await tmdbClientService.fetchTmdbSeriesMetadata({ imdbId: seriesImdbId }, { file: context?.file })
  if (result.status !== 'success') {
    const logger = getLogger(injector).withScope('ensureTmdbSeriesExists')
    await logger.warning({
      message: `Could not fetch TMDB series metadata for '${seriesImdbId}' (${result.status})`,
      data: { seriesImdbId, status: result.status, file: context?.file },
    })
    return
  }

  const imdbId = result.data.external_ids?.imdb_id ?? seriesImdbId
  await storeTmdbSeriesMetadata(result.data, imdbId, language, injector)
  await ensureSeriesExists(
    {
      imdbId,
      year: result.data.first_air_date?.slice(0, 4) ?? '',
      numberOfSeasons: result.data.number_of_seasons,
    },
    injector,
  )
  await ensureSeriesLocalizedMetadataExists(mapTmdbSeriesToLocalized(result.data, imdbId, language), injector)
}
