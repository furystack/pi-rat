import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import { Movie } from 'common'

type MovieInput = {
  imdbId: string
  year?: number
  duration?: number
  type?: 'movie' | 'episode'
  seriesId?: string
  season?: number
  episode?: number
}

export const ensureMovieExists = async (input: MovieInput, injector: Injector) => {
  const movieDataSet = getDataSetFor(injector, Movie, 'imdbId')
  const existingMovie = await movieDataSet.get(injector, input.imdbId)

  if (!existingMovie) {
    const {
      created: [newMovie],
    } = await movieDataSet.add(injector, {
      imdbId: input.imdbId,
      year: input.year,
      duration: input.duration,
      type: input.type,
      seriesId: input.seriesId,
      season: input.season,
      episode: input.episode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return newMovie
  }
  return existingMovie
}
