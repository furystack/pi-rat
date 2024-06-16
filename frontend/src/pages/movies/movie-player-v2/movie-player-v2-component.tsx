import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '@furystack/shades-common-components'
import { type Movie, type PiRatFile, type WatchHistoryEntry } from 'common'
import type { FfprobeData } from 'fluent-ffmpeg'
import { MediaApiClient } from '../../../services/api-clients/media-api-client.js'
import { WatchProgressService } from '../../../services/watch-progress-service.js'
import { WatchProgressUpdater } from '../../../services/watch-progress-updater.js'
import { getSubtitleTracks } from './getSubtitleTracks.js'
import { MoviePlayerService } from './movie-player-service.js'
import { MovieTitle } from './title.js'

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
          watchProgressService.updateWatchEntry({
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
      watchProgressUpdater.dispose()
    }
  },
  render: ({ props, element, useDisposable, injector }) => {
    const { watchProgress, file } = props

    const api = injector.getInstance(MediaApiClient)

    const mediaService = useDisposable('mediaService', () => new MoviePlayerService(file, props.ffprobe, api))

    mediaService.MediaSource.addEventListener('sourceopen', async () => {
      mediaService.MediaSource.duration = props.ffprobe.format.duration || 0
      mediaService.loadChunkForProgress(watchProgress?.watchedSeconds || 0)
    })

    useDisposable('mouseMoveListener', () => {
      const elementHideDelay = 3000

      const createTimedOutHide = () =>
        setTimeout(() => {
          element.querySelectorAll('.hideOnPlay').forEach((el) => {
            promisifyAnimation(
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
          promisifyAnimation(
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
        dispose: () => {
          element.removeEventListener('mousemove', onMouseMove)
        },
      }
    })

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
            const currentTime = (ev.currentTarget as HTMLVideoElement).currentTime as number
            mediaService.progress.setValue(currentTime || 0)
          }}
          onseeked={(ev) => {
            const currentTime = (ev.currentTarget as HTMLVideoElement).currentTime as number
            mediaService.loadChunkForProgress(currentTime)
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
