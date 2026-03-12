import { getLogger } from '@furystack/logging'
import { Shade, createComponent } from '@furystack/shades'
import { type FfprobeData, type Movie, type PiRatFile, type WatchHistoryEntry } from 'common'

import { MediaApiClient } from '../../../services/api-clients/media-api-client.js'
import { WatchProgressService } from '../../../services/watch-progress-service.js'
import { WatchProgressUpdater } from '../../../services/watch-progress-updater.js'
import { whenRefReady } from '../../../utils/when-ref-ready.js'
import { VideoContainer } from './controls/index.js'
import { getChaptersTrack } from './get-chapters-track.js'
import { getSubtitleTracks, getSubtitleTracksFromPlaybackInfo } from './get-subtitle-tracks.js'
import { MoviePlayerService } from './movie-player-service.js'

type MoviePlayerProps = {
  file: PiRatFile
  ffprobe: FfprobeData
  movie?: Movie
  watchProgress?: WatchHistoryEntry
}

export const MoviePlayerV2 = Shade<MoviePlayerProps>({
  customElementName: 'pirat-movie-player-v2',
  render: ({ props, useDisposable, useObservable, useRef, injector }) => {
    const videoRef = useRef<HTMLVideoElement>('video')
    const playerContainerRef = useRef<HTMLElement>('playerContainer')

    const { driveLetter, path } = props.file
    const watchProgressService = injector.getInstance(WatchProgressService)
    useDisposable('watchProgressUpdater', () => {
      const createUpdater = (video: HTMLVideoElement) =>
        new WatchProgressUpdater({
          intervalMs: 10 * 1000,
          onSave: async (progress) => {
            void watchProgressService.updateWatchEntry({
              completed: (mediaService.playbackInfo.getValue()?.duration ?? video.duration) - progress < 10,
              driveLetter,
              path,
              watchedSeconds: progress,
            })
          },
          saveTresholdSeconds: 10,
          videoElement: video,
        })

      const video = videoRef.current
      if (video) {
        return createUpdater(video)
      }

      let updater: WatchProgressUpdater | null = null
      const frameId = requestAnimationFrame(() => {
        const deferredVideo = videoRef.current
        if (deferredVideo) {
          updater = createUpdater(deferredVideo)
        }
      })
      return {
        [Symbol.asyncDispose]: async () => {
          cancelAnimationFrame(frameId)
          if (updater) {
            await updater[Symbol.asyncDispose]()
          }
        },
      }
    })
    const { watchProgress, file } = props

    const api = injector.getInstance(MediaApiClient)
    const logger = getLogger(injector).withScope('MoviePlayerService')

    const mediaService = useDisposable(
      'mediaService',
      () => new MoviePlayerService(file, props.ffprobe, api, watchProgress?.watchedSeconds || 0, logger),
    )

    useDisposable('videoAttachment', () =>
      whenRefReady(videoRef, (video) => {
        mediaService.attachToVideo(video)
      }),
    )

    const [playbackInfo] = useObservable('playbackInfo', mediaService.playbackInfo)
    const subtitleElements =
      playbackInfo && playbackInfo.subtitleTracks.length > 0
        ? getSubtitleTracksFromPlaybackInfo(playbackInfo.subtitleTracks)
        : getSubtitleTracks(props.file, props.ffprobe)

    return (
      <div
        ref={playerContainerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          crossOrigin="use-credentials"
          autoplay
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            position: 'fixed',
            top: '0',
            left: '0',
          }}
        >
          {...subtitleElements}
          {getChaptersTrack(props.ffprobe)}
        </video>
        <VideoContainer mediaService={mediaService} playerContainerRef={playerContainerRef} />
      </div>
    )
  },
})
