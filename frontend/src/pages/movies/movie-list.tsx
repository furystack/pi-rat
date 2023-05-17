import { Shade, createComponent } from '@furystack/shades'
import { MoviesService } from '../../services/movies-service.js'
import { MovieWidget } from '../../components/movie-widget.js'
import { isLoadedCacheResult } from '@furystack/cache'

export const MovieList = Shade({
  shadowDomName: 'shade-movie-list',
  render: ({ injector, useObservable }) => {
    const movieService = injector.getInstance(MoviesService)

    const [movies] = useObservable('movies', movieService.findMovieAsObservable({}))

    if (isLoadedCacheResult(movies)) {
      return (
        <div style={{ marginTop: '64px', display: 'flex', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
          {movies.value.entries.map((movie, index) => (
            <MovieWidget index={index} imdbId={movie.imdbId} />
          ))}
        </div>
      )
    }
    return null
  },
})
