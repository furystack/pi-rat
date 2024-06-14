import { Shade, createComponent } from '@furystack/shades'
import type { PiRatFile } from 'common'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { MoviesService } from '../../services/movies-service.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MoviePlayerV2 } from '../movies/movie-player-v2/movie-player-v2-component.js'

export const FileMoviePlayer = Shade<{ file: PiRatFile }>({
  shadowDomName: 'pirat-file-movie-player',
  render: ({ props, injector }) => {
    const { file } = props
    return (
      <PiRatLazyLoad
        component={async () => {
          const watchProgress = await injector.getInstance(WatchProgressService).findWatchProgressForFile(file)
          const movieFile = await injector.getInstance(MovieFilesService).findMovieFile({
            top: 1,
            filter: {
              path: { $eq: file.path },
              driveLetter: { $eq: file.driveLetter },
            },
          })

          if (movieFile.entries[0]?.imdbId) {
            const movie = await injector.getInstance(MoviesService).getMovie(movieFile.entries[0].imdbId)
            return (
              <MoviePlayerV2
                file={file}
                watchProgress={watchProgress.entries[0]}
                movieFile={movieFile.entries[0]}
                movie={movie}
              />
            )
          }

          return <MoviePlayerV2 file={file} watchProgress={watchProgress.entries[0]} />
        }}
      />
    )
  },
})
