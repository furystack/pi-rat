import { Shade, createComponent } from '@furystack/shades'
import { MoviesService } from '../../services/movies-service.js'
import { MovieWidget } from '../../components/movie-widget.js'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'

export const MovieList = Shade({
  shadowDomName: 'shade-movie-list',
  render: ({ injector }) => {
    const movieService = injector.getInstance(MoviesService)
    const movieFilesService = injector.getInstance(MovieFilesService)
    const watchProgressService = injector.getInstance(WatchProgressService)
    return (
      <PiRatLazyLoad
        component={async () => {
          const movies = await movieService.findMovie({})
          await Promise.all([
            movieFilesService.prefetchMovieFilesForMovies(movies.entries),
            watchProgressService.prefetchWatchProgressForMovies(movies.entries),
          ])

          return (
            <div
              style={{ marginTop: '64px', display: 'flex', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
              {movies.entries.map((movie, index) => (
                <MovieWidget index={index} imdbId={movie.imdbId} />
              ))}
            </div>
          )
        }}
      />
    )
  },
})
