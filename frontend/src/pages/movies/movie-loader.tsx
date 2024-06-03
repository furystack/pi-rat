import { Shade, createComponent } from '@furystack/shades'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MoviePlayer } from './movie-player.js'

export const MovieLoader = Shade<{ movieFileId: string }>({
  shadowDomName: 'pirat-movie-loader',
  render: ({ props, injector }) => {
    const movieFilesService = injector.getInstance(MovieFilesService)
    const watchProgressService = injector.getInstance(WatchProgressService)
    const { movieFileId } = props

    return (
      <PiRatLazyLoad
        component={async () => {
          const movieFile = await movieFilesService.getMovieFile(movieFileId)
          if (!movieFile) {
            throw new Error(`Movie file with id ${movieFileId} not found`)
          }

          const { path } = movieFile
          const {
            entries: [watchProgress],
          } = await watchProgressService.findWatchProgressForFile({
            path,
            driveLetter: movieFile.driveLetter,
          })

          return <MoviePlayer ffProbe={movieFile.ffprobe} file={movieFile} watchProgress={watchProgress} />
        }}
      />
    )
  },
})
