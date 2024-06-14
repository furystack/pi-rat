import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { getFileName, getParentPath, type Movie, type MovieFile, type PiRatFile, type WatchHistoryEntry } from 'common'
import { environmentOptions } from '../../../environment-options.js'
import { WatchProgressService } from '../../../services/watch-progress-service.js'
import { WatchProgressUpdater } from '../../../services/watch-progress-updater.js'
import { ControlArea } from './control-area.js'
import { MovieTitle } from './title.js'

interface MoviePlayerProps {
  file: PiRatFile
  movieFile?: MovieFile
  movie?: Movie
  watchProgress?: WatchHistoryEntry
}

export const MoviePlayerV2 = Shade<MoviePlayerProps>({
  shadowDomName: 'pirat-movie-player-v2',
  constructed: ({ useDisposable, element, injector, props }) => {
    const { driveLetter, path } = props.file
    const watchProgressService = injector.getInstance(WatchProgressService)
    const watchProgressUpdater = useDisposable('watchProgressUpdater', () => {
      const video = element.querySelector('video') as HTMLVideoElement
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
  render: ({ props, element, useDisposable }) => {
    const isPlaying = useDisposable('isPlaying', () => new ObservableValue(false))
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

    const { file, watchProgress } = props
    const fileName = getFileName(file)
    const { driveLetter, path } = file
    const parentPath = getParentPath(file)

    const subtitleTracks = props.movieFile?.ffprobe.streams
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
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          zIndex: '1',
          overflow: 'hidden',
        }}>
        <video
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          onplay={() => {
            isPlaying.setValue(true)
          }}
          onpause={() => {
            isPlaying.setValue(false)
          }}
          currentTime={watchProgress?.watchedSeconds || 0}>
          <source
            src={`${environmentOptions.serviceUrl}/media/files/${encodeURIComponent(driveLetter)}/${encodeURIComponent(
              path,
            )}/stream`}
            type="video/mp4"
          />
          {...subtitleTracks || []}
        </video>
        <div className="hideOnPlay">
          <MovieTitle file={props.file} movie={props.movie} />
          <ControlArea
            isPlaying={isPlaying}
            onPlay={() => {
              isPlaying.setValue(true)
              element.querySelector('video')?.play()
              // TODO: Start the video playback
            }}
            onPause={() => {
              isPlaying.setValue(false)
              element.querySelector('video')?.pause()
              // TODO: Pause the video playback
            }}
            onFullScreen={() => {
              document.fullscreenElement
                ? document.exitFullscreen()
                : element.requestFullscreen({
                    navigationUI: 'show',
                  })
            }}
          />
        </div>
      </div>
    )
  },
})
