import { attachProps, createComponent, Shade } from '@furystack/shades'
import { environmentOptions } from '../../environment-options.js'
import 'video.js'
import 'video.js/dist/video-js.css'
import * as videojsDefault from 'video.js'
import { WatchProgressUpdater } from '../../services/watch-progress-updater.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import type { FfprobeEndpoint, PiRatFile } from 'common'
import { encode, getFileName, getParentPath, type WatchHistoryEntry } from 'common'

const videojs = videojsDefault as any as typeof videojsDefault.default /* & any*/

interface MoviePlayerProps {
  file: PiRatFile
  ffProbe: FfprobeEndpoint['result']
  watchProgress?: WatchHistoryEntry
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

    const audioTrackList = (player as any).audioTracks()

    props.ffProbe.streams
      .filter((stream) => stream.codec_type === 'audio')
      .forEach((audio) => {
        const track = new (videojs as any).default.AudioTrack({
          id: audio.index,
          kind: Object.entries(audio.disposition).filter(([_key, value]) => value === 1)?.[0]?.[0] || 'default',
          label: audio.tags.title || audio.tags.language || audio.tags.filename,
          language: audio.tags.language,
        })
        audioTrackList.addTrack(track)
      })

    audioTrackList.addEventListener('change', () => {
      const activeTrack = audioTrackList.tracks_.find((track: any) => track.enabled)
      const currentSource = player.currentSource() as any as { type: string; src: string }
      const newUrl = new URL(currentSource.src)
      newUrl.searchParams.set('audioTrackId', encode(activeTrack.id))
      const currentTime = player.currentTime()
      player.src({ type: currentSource.type, src: newUrl.toString() })
      player.currentTime(currentTime)
    })

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
        controls
        className="video-js"
        crossOrigin="use-credentials"
        currentTime={watchProgress?.watchedSeconds || 0}
      >
        <source
          src={`${environmentOptions.serviceUrl}/media/files/${encodeURIComponent(driveLetter)}/${encodeURIComponent(
            path,
          )}/stream`}
          type="video/mp4"
        />
        {...subtitleTracks}
      </video>
    )
  },
})
