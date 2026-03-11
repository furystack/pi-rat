import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import { Series } from 'common'

type SeriesInput = {
  imdbId: string
  year: string
  numberOfSeasons?: number
}

export const ensureSeriesExists = async (input: SeriesInput, injector: Injector) => {
  const seriesDataSet = getDataSetFor(injector, Series, 'imdbId')
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
