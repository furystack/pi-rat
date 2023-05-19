import { createComponent, Shade } from '@furystack/shades'
import { environmentOptions } from '../../environment-options.js'
import 'video.js'
import 'video.js/dist/video-js.css'
import videojsDefault from 'video.js'
import { WatchProgressUpdater } from '../../services/watch-progress-updater.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MovieFilesService } from '../../services/movie-files-service.js'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'

const videojs = videojsDefault as any as typeof videojsDefault.default & any

export const MoviePlayer = Shade<{ movieFileId: string }>({
  shadowDomName: 'pirat-movie-player',
  render: ({ props, element, injector, useDisposable }) => {
    const movieFilesService = injector.getInstance(MovieFilesService)
    const watchProgressService = injector.getInstance(WatchProgressService)
    const { movieFileId } = props

    return (
      <PiRatLazyLoad
        component={async () => {
          const movieFile = await movieFilesService.getMovieFile(movieFileId)
          if (!movieFile) {
            throw new Error(`Movie file with id ${movieFileId} not found`)
          }
          const { fileName, path } = movieFile
          const {
            entries: [watchProgress],
          } = await watchProgressService.findWatchProgressForFile({
            path,
            driveLetter: movieFile.driveLetter,
            fileName,
          })

          setTimeout(() => {
            const video = element.querySelector('video') as HTMLVideoElement

            const { ffprobe } = movieFile
            const player = videojs(video)

            ffprobe.streams
              .filter((stream) => (stream.codec_type as any) === 'subtitle')
              .forEach((subtitle) => {
                player.addRemoteTextTrack({
                  kind: 'subtitles',
                  label: subtitle.tags.title || subtitle.tags.language || subtitle.tags.filename,
                  src: `${environmentOptions.serviceUrl}/media/stream/${encodeURIComponent(
                    movieFile.driveLetter,
                  )}/${encodeURIComponent(`${movieFile.path}-subtitle-${subtitle.index}.vtt`)}/download`,
                  srcLang: subtitle.tags.language,
                })
              })

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
                      fileName,
                      imdbId: movieFile.imdbId,
                      watchedSeconds: progress,
                    })
                  },
                  saveTresholdSeconds: 10,
                  videoElement: video,
                }),
            )
          }, 100)

          return (
            <video
              style={{
                width: '100%',
                height: '100%',
                position: 'fixed',
              }}
              className="video-js"
              crossOrigin="use-credentials"
              // data-setup={JSON.stringify({
              //   controls: true,
              //   autoplay: true,
              //   preload: 'auto',
              //   withCredentials: true,
              // })}
              autoplay
              currentTime={watchProgress?.watchedSeconds || 0}
              controls>
              <source
                src={`${environmentOptions.serviceUrl}/media/movie-files/${encodeURIComponent(movieFileId)}/stream`}
                type="video/mp4"
              />
            </video>
          )
        }}
      />
    )
  },
})