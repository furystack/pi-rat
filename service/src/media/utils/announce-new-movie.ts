import { isAuthorized } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { Movie, MovieFile, PiRatFile } from 'common'
import { WebsocketService } from '../../websocket-service.js'

export const announceNewMovie = async ({
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
  await injector
    .getInstance(WebsocketService)
    .announce({ type: 'add-movie', file, movie, movieFile }, async ({ injector: i }) => isAuthorized(i, 'admin'))
}
