import { Shade, createComponent } from '@furystack/shades'
import type { PiRatFile } from 'common'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { MoviePlayer } from '../movies/movie-player.js'
import { DrivesApiClient } from '../../services/api-clients/drives-api-client.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'

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
          return <MoviePlayer file={file} ffProbe={ffprobe.result} watchProgress={watchProgress.entries[0]} />
        }}
      />
    )
  },
})
