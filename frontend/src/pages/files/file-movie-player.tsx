import { Shade, createComponent } from '@furystack/shades'
import type { PiRatFile } from 'common'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { MoviePlayerV2 } from '../movies/movie-player-v2/movie-player-v2-component.js'
import { DrivesApiClient } from '../../services/api-clients/drives-api-client.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { MoviesService } from '../../services/movies-service.js'

export const FileMoviePlayer = Shade<{ file: PiRatFile }>({
  shadowDomName: 'pirat-file-movie-player',
  render: ({ props, injector }) => {
    const { file } = props
    return (
      <PiRatLazyLoad
        component={async () => {
          const ffprobe = await injector.getInstance(DrivesApiClient).call({
            method: 'GET',
            action: `/files/:letter/:path/ffprobe`,
            url: { letter: encodeURIComponent(props.file.driveLetter), path: encodeURIComponent(props.file.path) },
          })
          const watchProgress = await injector.getInstance(WatchProgressService).findWatchProgressForFile(file)
          const movieFile = await injector.getInstance(MovieFilesService).findMovieFile({top: 1, filter: {
            path: {$eq: file.path,},
            driveLetter: {$eq: file.driveLetter,},
          }})

          if (movieFile.entries[0]?.imdbId){
            const movie = await injector.getInstance(MoviesService).getMovie(movieFile.entries[0].imdbId)
            return <MoviePlayerV2 file={file} ffProbe={ffprobe.result} watchProgress={watchProgress.entries[0]} movieFile={movieFile.entries[0]} movie={movie} />
          }

          return <MoviePlayerV2 file={file} ffProbe={ffprobe.result} watchProgress={watchProgress.entries[0]} />
        }}
      />
    )
  },
})
