import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { OmdbSeriesMetadata, type OmdbMovieMetadata, type PiRatFile } from 'common'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { ensureSeriesExists } from './ensure-series-exists.js'
import { ensureSeriesLocalizedMetadataExists } from './ensure-localized-metadata-exists.js'
import { mapOmdbSeriesToLocalized } from './map-omdb-to-localized.js'

export const ensureOmdbSeriesExists = async (
  omdbMeta: OmdbMovieMetadata,
  injector: Injector,
  context?: { file?: PiRatFile },
) => {
  if (!omdbMeta.seriesID) {
    return
  }

  const omdbSeriesDataSet = getDataSetFor(injector, OmdbSeriesMetadata, 'imdbID')
  const storedResult = await omdbSeriesDataSet.get(injector, omdbMeta.seriesID)
  if (!storedResult) {
    const omdbClientService = injector.getInstance(OmdbClientService)
    const result = await omdbClientService.fetchOmdbSeriesMetadata(
      { imdbId: omdbMeta.seriesID },
      { file: context?.file },
    )
    if (result.status !== 'success') {
      const logger = getLogger(injector).withScope('ensureOmdbSeriesExists')
      await logger.warning({
        message: `Could not fetch series metadata for '${omdbMeta.seriesID}' (${result.status})`,
        data: { seriesID: omdbMeta.seriesID, status: result.status, file: context?.file },
      })
      return
    }
    const {
      created: [newAdded],
    } = await omdbSeriesDataSet.add(injector, result.data)
    await ensureSeriesExists(
      {
        imdbId: newAdded.imdbID,
        year: newAdded.Year,
        numberOfSeasons: parseInt(newAdded.totalSeasons, 10) || undefined,
      },
      injector,
    )
    await ensureSeriesLocalizedMetadataExists(mapOmdbSeriesToLocalized(newAdded), injector)
  } else {
    await ensureSeriesExists(
      {
        imdbId: storedResult.imdbID,
        year: storedResult.Year,
        numberOfSeasons: parseInt(storedResult.totalSeasons, 10) || undefined,
      },
      injector,
    )
    await ensureSeriesLocalizedMetadataExists(mapOmdbSeriesToLocalized(storedResult), injector)
  }
}
