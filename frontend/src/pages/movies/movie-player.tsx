import { attachProps, createComponent, Shade } from '@furystack/shades'
import { environmentOptions } from '../../environment-options.js'
import 'video.js'
import 'video.js/dist/video-js.css'
import * as videojsDefault from 'video.js'
import { WatchProgressUpdater } from '../../services/watch-progress-updater.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import type { FfprobeEndpoint, PiRatFile } from 'common'
import { getFileName, getParentPath, type MovieWatchHistoryEntry } from 'common'

const videojs = videojsDefault as any as typeof videojsDefault.default /* & any*/

interface MoviePlayerProps {
  file: PiRatFile
  ffProbe: FfprobeEndpoint['result']
  watchProgress?: MovieWatchHistoryEntry
}

export const MoviePlayer = Shade<MoviePlayerProps>({
  shadowDomName: 'pirat-movie-player',
  constructed: ({ props, element, injector, useDisposable }) => {
    const { file } = props
    const video = element.querySelector('video') as any as HTMLVideoElement

    const player = videojs.default(video, {
      controls: true,
      autoplay: true,
      html5: {
        nativeCaptions: false,
      },
    })

    const { path, driveLetter } = file
    const watchProgressService = injector.getInstance(WatchProgressService)

    useDisposable(
      'watchProgressUpdater',
      () =>
        new WatchProgressUpdater({
          intervalMs: 10 * 1000,
          onSave: async (progress) => {
            watchProgressService.updateWatchEntry({
              completed: video.duration - progress < 10,
              driveLetter,
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
    const { file, watchProgress, ffProbe } = props
    const fileName = getFileName(file)
    const { driveLetter, path } = file
    const parentPath = getParentPath(file)

    const subtitleTracks = ffProbe.streams
      .filter((stream) => (stream.codec_type as any) === 'subtitle')
      .map((subtitle) => (
        <track
          kind="captions"
          label={subtitle.tags.title || subtitle.tags.language || subtitle.tags.filename}
          src={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(
            driveLetter,
          )}/${encodeURIComponent(`${parentPath}/${fileName}-subtitle-${subtitle.index}.vtt`)}/download`}
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
          src={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(driveLetter)}/${encodeURIComponent(
            path,
          )}/download`}
          type="video/mp4"
        />
        {...subtitleTracks}
      </video>
    )
  },
})
