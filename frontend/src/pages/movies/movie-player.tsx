import { attachProps, createComponent, Shade } from '@furystack/shades'
import { environmentOptions } from '../../environment-options.js'
import 'video.js'
import 'video.js/dist/video-js.css'
import * as videojsDefault from 'video.js'
import { WatchProgressUpdater } from '../../services/watch-progress-updater.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { getFileName, getParentPath, type MovieFile, type MovieWatchHistoryEntry } from 'common'

const videojs = videojsDefault as any as typeof videojsDefault.default /* & any*/

interface MoviePlayerProps {
  movieFile: MovieFile
  watchProgress?: MovieWatchHistoryEntry
}

export const MoviePlayer = Shade<MoviePlayerProps>({
  shadowDomName: 'pirat-movie-player',
  constructed: ({ props, element, injector, useDisposable }) => {
    const { movieFile } = props
    const video = element.querySelector('video') as any as HTMLVideoElement

    const player = videojs.default(video, {
      controls: true,
      autoplay: true,
      html5: {
        nativeCaptions: false,
      },
    })

    const { path } = movieFile
    const watchProgressService = injector.getInstance(WatchProgressService)

    useDisposable(
      'watchProgressUpdater',
      () =>
        new WatchProgressUpdater({
          intervalMs: 10 * 1000,
          onSave: async (progress) => {
            watchProgressService.updateWatchEntry({
              completed: video.duration - progress < 10,
              driveLetter: movieFile.driveLetter,
              path,
              watchedSeconds: progress,
            })
          },
          saveTresholdSeconds: 10,
          videoElement: video,
        }),
    )

    attachProps(element, { player })

    return () => player.dispose()
  },
  render: ({ props }) => {
    const { movieFile, watchProgress } = props
    const fileName = getFileName(movieFile)

    const subtitleTracks = movieFile.ffprobe.streams
      .filter((stream) => (stream.codec_type as any) === 'subtitle')
      .map((subtitle) => (
        <track
          kind="captions"
          label={subtitle.tags.title || subtitle.tags.language || subtitle.tags.filename}
          src={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(
            movieFile.driveLetter,
          )}/${encodeURIComponent(`${getParentPath(movieFile)}/${fileName}-subtitle-${subtitle.index}.vtt`)}/download`}
          srclang={subtitle.tags.language}
        />
      ))

    return (
      <video
        style={{
          width: '100%',
          height: '100%',
          position: 'fixed',
        }}
        className="video-js"
        crossOrigin="use-credentials"
        currentTime={watchProgress?.watchedSeconds || 0}>
        <source
          src={`${environmentOptions.serviceUrl}/media/movie-files/${encodeURIComponent(movieFile.id)}/stream`}
          type="video/mp4"
        />
        {...subtitleTracks}
      </video>
    )
  },
})
