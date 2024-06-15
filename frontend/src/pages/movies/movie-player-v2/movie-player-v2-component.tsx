import { Shade, createComponent } from '@furystack/shades'
import { promisifyAnimation } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { type Movie, type PiRatFile, type WatchHistoryEntry } from 'common'
import type { FfprobeData } from 'fluent-ffmpeg'
import { environmentOptions } from '../../../environment-options.js'
import { WatchProgressService } from '../../../services/watch-progress-service.js'
import { WatchProgressUpdater } from '../../../services/watch-progress-updater.js'
import { ControlArea } from './control-area.js'
import { getSubtitleTracks } from './getSubtitleTracks.js'
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
  render: ({ props, element, useDisposable }) => {
    const { watchProgress, file } = props
    const { driveLetter, path } = file
    const isPlaying = useDisposable('isPlaying', () => new ObservableValue(false))
    const isFullScreen = useDisposable('isFullScreen', () => new ObservableValue(false))
    const isMuted = useDisposable('isMuted', () => new ObservableValue(false))
    const volume = useDisposable('volume', () => new ObservableValue(100))
    const watchProgressObservable = useDisposable(
      'watchProgress',
      () => new ObservableValue(watchProgress?.watchedSeconds || 0),
    )

    const getVideo = () => element.querySelector('video') as HTMLVideoElement

    const mediaSource = useDisposable('mediaSource', () => {
      const ms = new MediaSource()
      Object.assign(ms, {
        dispose: () => {
          ;[...ms.sourceBuffers].forEach((sb) => {
            try {
              ms.removeSourceBuffer(sb)
            } catch (e) {
              console.error(e)
            }
          })
        },
      })
      return ms as MediaSource & { dispose: () => void }
    })

    mediaSource.addEventListener('sourceopen', async () => {
      const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E"')
      const response = await fetch(
        `${environmentOptions.serviceUrl}/media/files/${encodeURIComponent(driveLetter)}/${encodeURIComponent(
          path,
        )}/stream`,
        {
          credentials: 'include',
          mode: 'cors',
        },
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`)
      }
      sourceBuffer.addEventListener('updateend', () => {
        mediaSource.endOfStream()
        console.log(mediaSource.readyState) // ended
      })
      const ab = await response.arrayBuffer()
      sourceBuffer.appendBuffer(ab)
    })

    isPlaying.subscribe((playingValue) => {
      const video = getVideo()
      if (playingValue) {
        console.log(mediaSource.readyState)
        video.play()
      } else {
        video.pause()
      }
    })

    isFullScreen.subscribe((fullScreenValue) => {
      if (fullScreenValue) {
        element.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    })

    isMuted.subscribe((mutedValue) => {
      getVideo().muted = mutedValue
    })

    volume.subscribe((volumeValue) => {
      getVideo().volume = volumeValue / 100
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
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          zIndex: '1',
          overflow: 'hidden',
        }}
      >
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
          onvolumechange={(ev) => {
            const video = ev.target as HTMLVideoElement
            volume.setValue(video.volume * 100)
            isMuted.setValue(video.muted)
          }}
          onprogress={() => {
            watchProgressObservable.setValue(getVideo().currentTime)
          }}
          currentTime={watchProgress?.watchedSeconds || 0}
          src={URL.createObjectURL(mediaSource)}
        >
          <source
            src={`${environmentOptions.serviceUrl}/media/files/${encodeURIComponent(driveLetter)}/${encodeURIComponent(
              path,
            )}/stream`}
            type="video/mp4"
          />
          {...getSubtitleTracks(props.file, props.ffprobe)}
        </video>
        <div className="hideOnPlay">
          <MovieTitle file={props.file} movie={props.movie} />
          <ControlArea
            watchedSeconds={watchProgressObservable}
            isPlaying={isPlaying}
            isFullScreen={isFullScreen}
            isMuted={isMuted}
            volume={volume}
            lengthSeconds={props.ffprobe.format.duration || 0}
            seekTo={(seconds) => {
              getVideo().currentTime = Math.round(seconds)
            }}
          />
        </div>
      </div>
    )
  },
})
