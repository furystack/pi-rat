import { Shade, createComponent } from '@furystack/shades'
import { Icon } from '@furystack/shades-common-components'

import type { MoviePlayerService } from '../movie-player-service.js'
import { captionsIcon } from './player-icons.js'

type CaptionsButtonProps = {
  mediaService: MoviePlayerService
}

export const CaptionsButton = Shade<CaptionsButtonProps>({
  customElementName: 'pirat-player-captions-button',
  render: ({ props, useObservable }) => {
    const [activeTrack] = useObservable('activeTrack', props.mediaService.activeSubtitleTrack)

    return (
      <button
        type="button"
        data-testid="captions-button"
        title={activeTrack !== null ? 'Disable captions' : 'Enable captions'}
        onclick={() => {
          const video = props.mediaService.videoElement
          if (!video) return

          const tracks = Array.from(video.textTracks)
          const subtitleTracks = tracks.filter((t) => t.kind === 'subtitles' || t.kind === 'captions')

          if (activeTrack !== null) {
            for (const track of subtitleTracks) {
              track.mode = 'hidden'
            }
            props.mediaService.activeSubtitleTrack.setValue(null)
          } else if (subtitleTracks[0]) {
            subtitleTracks[0].mode = 'showing'
            props.mediaService.activeSubtitleTrack.setValue(0)
          }
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          opacity: activeTrack !== null ? '1' : '0.5',
        }}
      >
        <Icon icon={captionsIcon} />
      </button>
    )
  },
})
