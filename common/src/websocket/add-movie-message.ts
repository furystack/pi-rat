import type { PiRatFile } from '../models/pirat-file.js'
import type { MovieFile } from '../models/index.js'
import type { Movie } from '../models/media/movie.js'

export interface AddMovieMessage {
  type: 'add-movie'
  file: PiRatFile
  movie: Movie
  movieFile: MovieFile
}
