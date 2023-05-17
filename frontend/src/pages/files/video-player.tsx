import { createComponent, Shade } from '@furystack/shades'
import { environmentOptions } from '../../environment-options.js'
import 'video.js'
import 'video.js/dist/video-js.css'
import videojsDefault from 'video.js'
import { DrivesApiClient } from '../../services/api-clients/drives-api-client.js'

const videojs = videojsDefault as any as typeof videojsDefault.default & any

export const VideoPlayer = Shade<{ letter: string; path: string }>({
  shadowDomName: 'drives-files-video-player',
  render: ({ props, element, injector }) => {
    const drivesApi = injector.getInstance(DrivesApiClient)

    const { letter, path } = props

    drivesApi
      .call({
        method: 'GET',
        action: '/files/:letter/:path/ffprobe',
        url: {
          path: encodeURIComponent(path),
          letter: encodeURIComponent(letter),
        },
      })
      .then((ffprobe) => {
        const video = element.querySelector('video') as HTMLVideoElement
        const player = videojs(video)

        const audioTracks = ffprobe.result.streams
          .filter((stream) => stream.codec_type === 'audio')
          .map(
            (stream) =>
              new videojs.AudioTrack({
                index: stream.index,
                id: `audio-track-${stream.index}`,
                label: stream.tags.language || stream.tags.title || stream.tags.filename || stream.index,
              }),
          )
        audioTracks.forEach((track) => player.audioTracks().addTrack(track))

        ffprobe.result.streams
          .filter((stream) => (stream.codec_type as any) === 'subtitle')
          .forEach((subtitle) => {
            player.addTextTrack(
              'subtitles',
              subtitle.tags.language || subtitle.tags.title || subtitle.tags.filename,
              subtitle.tags.language,
            )
          })
      })

    return (
      <video
        style={{
          objectFit: 'contain',
          width: '100%',
          height: 'calc(100vh - 64px)',
          marginTop: '64px',
        }}
        className="video-js"
        data-setup={JSON.stringify({
          controls: true,
          autoplay: true,
          preload: 'auto',
          audioTracks: [],
        })}
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
