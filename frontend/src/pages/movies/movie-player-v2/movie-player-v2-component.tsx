import { getLogger } from '@furystack/logging'
import { Shade, createComponent } from '@furystack/shades'
import { type FfprobeData, type Movie, type PiRatFile, type WatchHistoryEntry } from 'common'
import type { AudioTrack, Rendition } from 'media-chrome/dist/media-store/state-mediator.js'
import { MediaApiClient } from '../../../services/api-clients/media-api-client.js'
import { WatchProgressService } from '../../../services/watch-progress-service.js'
import { WatchProgressUpdater } from '../../../services/watch-progress-updater.js'
import { getChaptersTrack } from './get-chapters-track.js'
import { getSubtitleTracks, getSubtitleTracksFromPlaybackInfo } from './get-subtitle-tracks.js'
import './media-chrome.js'
import { MoviePlayerService } from './movie-player-service.js'

type MoviePlayerProps = {
  file: PiRatFile
  ffprobe: FfprobeData
  movie?: Movie
  watchProgress?: WatchHistoryEntry
}

export const MoviePlayerV2 = Shade<MoviePlayerProps>({
  shadowDomName: 'pirat-movie-player-v2',
  render: ({ props, useDisposable, useRef, injector }) => {
    const videoRef = useRef<HTMLVideoElement>('video')
    const containerRef = useRef<HTMLElement>('container')

    const { driveLetter, path } = props.file
    const watchProgressService = injector.getInstance(WatchProgressService)
    useDisposable('watchProgressUpdater', () => {
      const video = videoRef.current
      if (!video) {
        return { [Symbol.asyncDispose]: async () => {} }
      }
      return new WatchProgressUpdater({
        intervalMs: 10 * 1000,
        onSave: async (progress) => {
          void watchProgressService.updateWatchEntry({
            completed: video.duration - progress < 10,
            driveLetter,
            path,
            watchedSeconds: progress,
          })
        },
        saveTresholdSeconds: 10,
        videoElement: video,
      })
    })
    const { watchProgress, file } = props

    const api = injector.getInstance(MediaApiClient)
    const logger = getLogger(injector).withScope('MoviePlayerService')

    const mediaService = useDisposable(
      'mediaService',
      () => new MoviePlayerService(file, props.ffprobe, api, watchProgress?.watchedSeconds || 0, logger),
    )

    useDisposable('videoAttachment', () => {
      const video = videoRef.current
      if (video) {
        mediaService.attachToVideo(video)
      }
      return { [Symbol.dispose]: () => {} }
    })

    const playbackInfoTracks = mediaService.getSubtitleTrackInfoFromPlaybackInfo()
    const subtitleElements =
      playbackInfoTracks.length > 0
        ? getSubtitleTracksFromPlaybackInfo(playbackInfoTracks)
        : getSubtitleTracks(props.file, props.ffprobe)

    return (
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <media-controller
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <media-settings-menu anchor="auto" hidden>
            <media-settings-menu-item>
              Speed
              <media-playback-rate-menu slot="submenu" hidden>
                <div slot="title">Speed</div>
              </media-playback-rate-menu>
            </media-settings-menu-item>
            <media-settings-menu-item>
              Quality
              <media-rendition-menu
                slot="submenu"
                hidden
                onchange={(ev) => {
                  const validValues = ['4k', '1080p', '720p', '480p', '360p'] as const
                  const { value } = ev.currentTarget as HTMLInputElement

                  if (validValues.includes(value as (typeof validValues)[number])) {
                    mediaService.resolution.setValue(value as (typeof validValues)[number])
                  } else {
                    mediaService.resolution.setValue(undefined)
                  }
                }}
              >
                <div slot="title">Quality</div>
              </media-rendition-menu>
            </media-settings-menu-item>
            <media-settings-menu-item>
              Captions
              <media-captions-menu slot="submenu" hidden>
                <div slot="title">Captions</div>
              </media-captions-menu>
            </media-settings-menu-item>
            <media-settings-menu-item>
              Audio
              <media-audio-track-menu
                slot="submenu"
                hidden
                onchange={(ev) => {
                  const newId = parseInt((ev.target as HTMLInputElement).value, 10)
                  if (!isNaN(newId)) {
                    void mediaService.switchAudioTrack(newId)
                  }
                }}
              >
                <div slot="title">Audio</div>
              </media-audio-track-menu>
            </media-settings-menu-item>
          </media-settings-menu>
          <video
            ref={videoRef}
            slot="media"
            crossOrigin="use-credentials"
            autoplay
            onloadstart={(ev) => {
              const playbackInfoAudioTracks = mediaService.getAudioTrackInfoFromPlaybackInfo()
              const audioTracks =
                playbackInfoAudioTracks.length > 0
                  ? playbackInfoAudioTracks
                  : mediaService.getAudioTracks().map((t) => ({
                      index: t.id,
                      label:
                        (t.stream.tags as Record<string, string>)?.language ||
                        (t.stream.tags as Record<string, string>)?.title ||
                        `Audio Track`,
                      language: (t.stream.tags as Record<string, string>)?.language || 'unknown',
                      codecName: t.codecName ?? 'unknown',
                      channels: t.stream.channels ?? 2,
                      isDefault: t.stream.disposition?.default === 1,
                    }))

              const video = ev.currentTarget as HTMLVideoElement & {
                audioTracks: AudioTrack[]
                videoRenditions: Rendition[]
              }

              video.audioTracks = audioTracks.map((track, index) => ({
                id: track.index.toFixed(0),
                label: track.label || track.language || `Audio Track ${index + 1}`,
                language: track.language,
                enabled: index === 0,
                kind: track.label,
              }))

              const currentValue = mediaService.resolution.getValue()
              const videoStream = props.ffprobe.streams.find((stream) => stream.codec_type === 'video')
              const height = videoStream?.height || 1080

              video.videoRenditions = [
                ...(height >= 2160
                  ? [{ id: '4k', width: 3840, height: 2160, src: '', selected: currentValue === '4k' }]
                  : []),
                ...(height >= 1080
                  ? [{ id: '1080p', width: 1920, height: 1080, src: '', selected: currentValue === '1080p' }]
                  : []),
                ...(height >= 720
                  ? [{ id: '720p', width: 1280, height: 720, src: '', selected: currentValue === '720p' }]
                  : []),
                ...(height >= 480
                  ? [{ id: '480p', width: 854, height: 480, src: '', selected: currentValue === '480p' }]
                  : []),
                { id: '360p', width: 640, height: 360, src: '', selected: currentValue === '360p' },
              ]

              if (video.audioTracks[0]) {
                mediaService.audioTrackId.setValue(parseInt(video.audioTracks[0].id as string, 10))
              }
            }}
            ontimeupdate={(ev) => {
              const { currentTime } = ev.currentTarget as HTMLVideoElement
              mediaService.progress.setValue(currentTime || 0)
            }}
            currentTime={watchProgress?.watchedSeconds || 0}
          >
            {...subtitleElements}
            {getChaptersTrack(props.ffprobe)}
          </video>

          <media-loading-indicator slot="centered-chrome"></media-loading-indicator>
          <media-error-dialog slot="dialog"></media-error-dialog>
          <media-poster-image slot="poster" src={props.movie?.thumbnailImageUrl} />

          <media-control-bar style={{ width: '100%' }}>
            <media-play-button />
            <media-time-display />
            <media-time-range />
            <media-duration-display />
            <media-volume-range />
            <media-mute-button />
            <media-fullscreen-button />
            <media-pip-button />
            <media-captions-button />
            <media-settings-menu-button></media-settings-menu-button>
          </media-control-bar>
        </media-controller>
      </div>
    )
  },
})
