import { createComponent, Shade } from '@furystack/shades'
import { environmentOptions } from '../../environment-options.js'
import 'video.js'
import 'video.js/dist/video-js.css'
import videojsDefault from 'video.js'
import { WatchProgressUpdater } from '../../services/watch-progress-updater.js'
import { WatchProgressService } from '../../services/watch-progress-service.js'
import { MovieFilesService } from '../../services/movie-files-service.js'

const videojs = videojsDefault as any as typeof videojsDefault.default & any

export const VideoPlayer = Shade<{ letter: string; path: string }>({
  shadowDomName: 'drives-files-video-player',
  render: ({ props, element, injector, useDisposable }) => {
    const movieFilesService = injector.getInstance(MovieFilesService)
    const watchProgressService = injector.getInstance(WatchProgressService)

    const { letter, path } = props

    Promise.all([
      movieFilesService.findMovieFile({
        filter: {
          path: { $eq: path },
          driveLetter: { $eq: letter },
        },
        top: 1,
      }),
      watchProgressService.findWatchProgressForFile({
        path,
        driveLetter: letter,
      }),
    ]).then(
      ([
        {
          entries: [file],
        },
        {
          entries: [watchProgress],
        },
      ]) => {
        const video = element.querySelector('video') as HTMLVideoElement

        if (watchProgress) {
          watchProgress && (video.currentTime = watchProgress.watchedSeconds)
        }

        if (file) {
          const { ffprobe } = file
          const player = videojs(video)

          ffprobe.streams
            .filter((stream) => (stream.codec_type as any) === 'subtitle')
            .forEach((subtitle) => {
              player.addRemoteTextTrack({
                kind: 'subtitles',
                label: subtitle.tags.title || subtitle.tags.language || subtitle.tags.filename,
                src: `${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(letter)}/${encodeURIComponent(
                  `${path}-subtitle-${subtitle.index}.vtt`,
                )}/download`,
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
                    driveLetter: letter,
                    path,
                    watchedSeconds: progress,
                  })
                },
                saveTresholdSeconds: 10,
                videoElement: video,
              }),
          )
        } else {
          console.warn("Movie is not linked. Watch progress won't be saved.")
        }
      },
    )

    return (
      <video
        style={{
          objectFit: 'contain',
          width: '100%',
          height: 'calc(100vh - 40px)',
          marginTop: '40px',
        }}
        className="video-js"
        crossOrigin="use-credentials"
        autoplay
        controls>
        <source
          src={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(letter)}/${encodeURIComponent(
            path,
          )}/download`}
          type="video/mp4"
        />
      </video>
    )
  },
})
