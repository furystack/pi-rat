import { Shade, createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { MoviesService } from '../../services/movies-service.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MoviePlayerV2 } from './movie-player-v2/movie-player-v2-component.js'

export const MovieLoader = Shade<{ movieFileId: string }>({
  shadowDomName: 'pirat-movie-loader',
  render: ({ props, injector }) => {
    const movieFilesService = injector.getInstance(MovieFilesService)
    const watchProgressService = injector.getInstance(WatchProgressService)
    const movieService = injector.getInstance(MoviesService)
    const { movieFileId } = props

    return (
      <PiRatLazyLoad
        component={async () => {
          const movieFile = await movieFilesService.getMovieFile(movieFileId)
          if (!movieFile) {
            throw new Error(`Movie file with id ${movieFileId} not found`)
          }

          const movie = movieFile.imdbId ? await movieService.getMovie(movieFile.imdbId) : undefined

          const { path } = movieFile
          const {
            entries: [watchProgress],
          } = await watchProgressService.findWatchProgressForFile({
            path,
            driveLetter: movieFile.driveLetter,
          })

          return <MoviePlayerV2 ffProbe={movieFile.ffprobe} file={movieFile} watchProgress={watchProgress} movie={movie} />
        }}
      />
    )
  },
})
