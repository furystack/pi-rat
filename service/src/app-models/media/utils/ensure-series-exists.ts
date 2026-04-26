import { SeriesDataSet } from '../media-data-sets.js'
import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'

type SeriesInput = {
  imdbId: string
  year: string
  numberOfSeasons?: number
}

export const ensureSeriesExists = async (input: SeriesInput, injector: Injector) => {
  const seriesDataSet = getDataSetFor(injector, SeriesDataSet)
  const existingSeries = await seriesDataSet.get(injector, input.imdbId)

  if (!existingSeries) {
    await seriesDataSet.add(injector, {
      imdbId: input.imdbId,
      year: input.year,
      numberOfSeasons: input.numberOfSeasons,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
}
