import { getLogger } from '@furystack/logging'
import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '@furystack/shades-common-components'
import { type FfprobeData, type Movie, type PiRatFile, type WatchHistoryEntry } from 'common'
import type { AudioTrack, Rendition } from 'media-chrome/dist/media-store/state-mediator.js'
import { MediaApiClient } from '../../../services/api-clients/media-api-client.js'
import { WatchProgressService } from '../../../services/watch-progress-service.js'
import { WatchProgressUpdater } from '../../../services/watch-progress-updater.js'
import { getChaptersTrack } from './get-chapters-track.js'
import { getSubtitleTracks } from './get-subtitle-tracks.js'
import './media-chrome.js'
import { MoviePlayerService } from './movie-player-service.js'
import { MovieTitle } from './title.js'

const ENABLE_MEDIA_CHROME = true

interface MoviePlayerProps {
  file: PiRatFile
  ffprobe: FfprobeData
  movie?: Movie
  watchProgress?: WatchHistoryEntry
}

export const MoviePlayerV2 = Shade<MoviePlayerProps>({
  shadowDomName: 'pirat-movie-player-v2',
  constructed: ({ useDisposable, element, injector, props }) => {
    const getVideo = () => element.querySelector('video') as HTMLVideoElement

    const { driveLetter, path } = props.file
    const watchProgressService = injector.getInstance(WatchProgressService)
    const watchProgressUpdater = useDisposable('watchProgressUpdater', () => {
      const video = getVideo()
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

    return () => {
      void watchProgressUpdater[Symbol.asyncDispose]()
    }
  },
  render: ({ props, element, useDisposable, injector }) => {
    const { watchProgress, file } = props

    const api = injector.getInstance(MediaApiClient)

    const logger = getLogger(injector).withScope('MoviePlayerService')

    const mediaService = useDisposable(
      'mediaService',
      () => new MoviePlayerService(file, props.ffprobe, api, watchProgress?.watchedSeconds || 0, logger),
    )

    mediaService.MediaSource.addEventListener('sourceopen', () => {
      mediaService.MediaSource.duration = props.ffprobe.format.duration || 0
    })

    useDisposable('mouseMoveListener', () => {
      const elementHideDelay = 3000

      const createTimedOutHide = () =>
        setTimeout(() => {
          element.querySelectorAll('.hideOnPlay').forEach((el) => {
            void promisifyAnimation(
              el,
              [
                {
                  opacity: 1,
                },
                {
                  opacity: 0,
                },
              ],
              {
                duration: 1500,
                easing: 'ease-out',
                fill: 'forwards',
              },
            )
          })
        }, elementHideDelay)

      let timeoutId = createTimedOutHide()

      const onMouseMove = () => {
        clearTimeout(timeoutId)
        element.querySelectorAll('.hideOnPlay').forEach((el) => {
          void promisifyAnimation(
            el,
            [
              {
                opacity: (el as HTMLElement).style.opacity,
              },
              {
                opacity: 1,
              },
            ],
            {
              duration: 1500,
              easing: 'ease-in-out',
              fill: 'forwards',
            },
          )
        })
        timeoutId = createTimedOutHide()
      }
      element.addEventListener('mousemove', onMouseMove)

      return {
        [Symbol.dispose]: () => {
          element.removeEventListener('mousemove', onMouseMove)
        },
      }
    })

    if (ENABLE_MEDIA_CHROME) {
      return (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <media-controller
            style={{
              // position: 'fixed',
              // top: '0',
              // left: '0',
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
                  mediaRenditionList={[
                    {
                      id: '1080p',
                      width: 1920,
                      height: 1080,
                      src: mediaService.url,
                    },
                    {
                      id: '720p',
                      width: 1280,
                      height: 720,
                      src: mediaService.url,
                    },
                    {
                      id: '480p',
                      width: 854,
                      height: 480,
                      src: mediaService.url,
                    },
                    {
                      id: '360p',
                      width: 640,
                      height: 360,
                      src: mediaService.url,
                    },
                  ]}
                  slot="submenu"
                  hidden
                  mediaRenditionSelected={mediaService.resolution.getValue() || undefined}
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
                      mediaService.audioTrackId.setValue(newId)
                    }
                  }}
                >
                  <div slot="title">Audio</div>
                </media-audio-track-menu>
              </media-settings-menu-item>
            </media-settings-menu>
            <video
              slot="media"
              crossOrigin="use-credentials"
              autoplay
              onloadstart={(ev) => {
                const audioTracks = mediaService.getAudioTracks()
                const video = ev.currentTarget as HTMLVideoElement & {
                  audioTracks: AudioTrack[]
                  videoRenditions: Rendition[]
                }
                video.audioTracks = audioTracks.map((track, index) => {
                  const id = track.stream.index.toFixed(0)
                  const { language = 'unknown' } = track.stream.tags as { language?: string }
                  const { title = language } = track.stream.tags as { title?: string }
                  const label = language || title || `Audio Track ${index + 1}`
                  return {
                    id,
                    label,
                    language,
                    enabled: false,
                    kind: title,
                  }
                })
                video.audioTracks[0].enabled = true

                const currentValue = mediaService.resolution.getValue()

                const videoStream = props.ffprobe.streams.find((stream) => stream.codec_type === 'video')
                const height = videoStream?.height || 1080

                video.videoRenditions = [
                  ...(height >= 2160
                    ? [
                        {
                          id: '4k',
                          width: 3840,
                          height: 2160,
                          src: mediaService.url,
                          selected: currentValue === '4k',
                        },
                      ]
                    : []),
                  ...(height >= 1080
                    ? [
                        {
                          id: '1080p',
                          width: 1920,
                          height: 1080,
                          src: mediaService.url,
                          selected: currentValue === '1080p',
                        },
                      ]
                    : []),
                  ...(height >= 720
                    ? [
                        {
                          id: '720p',
                          width: 1280,
                          height: 720,
                          src: mediaService.url,
                          selected: currentValue === '720p',
                        },
                      ]
                    : []),
                  ...(height >= 480
                    ? [
                        {
                          id: '480p',
                          width: 854,
                          height: 480,
                          src: mediaService.url,
                          selected: currentValue === '480p',
                        },
                      ]
                    : []),
                  {
                    id: '360p',
                    width: 640,
                    height: 360,
                    src: mediaService.url,
                    selected: currentValue === '360p',
                  },
                ]

                mediaService.audioTrackId.setValue(parseInt(video.audioTracks[0].id as string, 10))
              }}
              ontimeupdate={(ev) => {
                const { currentTime } = ev.currentTarget as HTMLVideoElement
                mediaService.progress.setValue(currentTime || 0)
              }}
              onseeked={(ev) => {
                const { currentTime } = ev.currentTarget as HTMLVideoElement
                void mediaService.onProgressChange(currentTime)
              }}
              currentTime={watchProgress?.watchedSeconds || 0}
              src={mediaService.url}
            >
              {...getSubtitleTracks(props.file, props.ffprobe)}
              {getChaptersTrack(props.ffprobe)}
            </video>

            <media-loading-indicator slot="centered-chrome"></media-loading-indicator>
            <media-error-dialog slot="dialog"></media-error-dialog>
            <media-poster-image slot="poster" src={props.movie?.thumbnailImageUrl} />

            <media-control-bar
              style={{
                width: '100%',
              }}
            >
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
    }

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <video
          crossOrigin="use-credentials"
          controls
          autoplay
          style={{
            // position: 'fixed',
            // top: '0',
            // left: '0',
            display: 'flex',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          ontimeupdate={(ev) => {
            const { currentTime } = ev.currentTarget as HTMLVideoElement
            mediaService.progress.setValue(currentTime || 0)
          }}
          onseeked={(ev) => {
            const { currentTime } = ev.currentTarget as HTMLVideoElement
            void mediaService.onProgressChange(currentTime)
          }}
          currentTime={watchProgress?.watchedSeconds || 0}
          src={mediaService.url}
        >
          {...getSubtitleTracks(props.file, props.ffprobe)}
        </video>
        <div className="hideOnPlay">
          <MovieTitle file={file} movie={props.movie} />
        </div>
      </div>
    )
  },
})
