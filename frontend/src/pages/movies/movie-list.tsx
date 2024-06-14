import { Shade, createComponent } from '@furystack/shades'
import { MoviesService } from '../../services/movies-service.js'
import { MovieWidget } from '../../components/dashboard/movie-widget.js'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'

export const MovieList = Shade({
  shadowDomName: 'shade-series-list',
  render: ({ injector }) => {
    const movieService = injector.getInstance(MoviesService)
    const movieFilesService = injector.getInstance(MovieFilesService)
    const watchProgressService = injector.getInstance(WatchProgressService)
    return (
      <PiRatLazyLoad
        component={async () => {
          const movies = await movieService.findMovie({})
          const movieFiles = await movieFilesService.findMovieFile({})
          await Promise.all([
            movieFilesService.prefetchMovieFilesForMovies(movies.entries),
            watchProgressService.prefetchWatchProgressForFiles(movieFiles.entries),
          ])

          return (
            <div
              style={{ marginTop: '64px', display: 'flex', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {movies.entries
                .filter((m) => !m.seriesId)
                .map((movie, index) => (
                  <MovieWidget index={index} imdbId={movie.imdbId} />
                ))}
            </div>
          )
        }}
      />
    )
  },
})
