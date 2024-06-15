import { Shade, createComponent } from '@furystack/shades'
import type { Disposable } from '@furystack/utils'
import type { PiRatFile } from 'common'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { FfprobeService } from '../../services/ffprobe-service.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { MoviesService } from '../../services/movies-service.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MoviePlayerV2 } from '../movies/movie-player-v2/movie-player-v2-component.js'

export const FileMoviePlayer = Shade<{ file: PiRatFile }>({
  shadowDomName: 'pirat-file-movie-player',
  render: ({ props, injector, useDisposable }) => {
    const { file } = props

    const mediaSource = useDisposable('mediaSource', () => {
      const ms = new MediaSource()
      Object.assign(ms, {
        dispose: () => {
          ;[...ms.sourceBuffers].forEach((sb) => ms.removeSourceBuffer(sb))
        },
      })
      return ms as MediaSource & Disposable
    })

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
          const ffProbe = await injector.getInstance(FfprobeService).getFfprobe(file)

          if (movieFile.entries[0]?.imdbId) {
            const movie = await injector.getInstance(MoviesService).getMovie(movieFile.entries[0].imdbId)
            return (
              <MoviePlayerV2
                file={file}
                watchProgress={watchProgress.entries[0]}
                ffprobe={movieFile.entries[0].ffprobe}
                movie={movie}
                mediaSource={mediaSource}
              />
            )
          }

          return (
            <MoviePlayerV2
              file={file}
              watchProgress={watchProgress.entries[0]}
              ffprobe={ffProbe}
              mediaSource={mediaSource}
            />
          )
        }}
      />
    )
  },
})
