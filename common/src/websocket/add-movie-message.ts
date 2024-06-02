import type { MovieFile } from '../models/index.js'
import type { Movie } from '../models/media/movie.js'

export interface AddMovieMessage {
  type: 'add-movie'
  driveLetter: string
  path: string
  fileName: string
  movie: Movie
  movieFile: MovieFile
}
