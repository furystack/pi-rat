import { Shade, createComponent } from '@furystack/shades'
import { Icon } from '@furystack/shades-common-components'

import type { MoviePlayerService } from '../movie-player-service.js'
import { volumeHighIcon, volumeLowIcon, volumeMuteIcon } from './player-icons.js'

type VolumeControlProps = {
  mediaService: MoviePlayerService
}

export const VolumeControl = Shade<VolumeControlProps>({
  customElementName: 'pirat-player-volume-control',
  css: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    '& input[type="range"]': {
      width: '80px',
      cursor: 'pointer',
      accentColor: 'white',
    },
  },
  render: ({ props, useObservable }) => {
    const [isMuted] = useObservable('isMuted', props.mediaService.isMuted)
    const [volume] = useObservable('volume', props.mediaService.volume)

    const getVolumeIcon = () => {
      if (isMuted || volume === 0) return volumeMuteIcon
      if (volume < 0.5) return volumeLowIcon
      return volumeHighIcon
    }

    return (
      <>
        <button
          type="button"
          data-testid="mute-button"
          title={isMuted ? 'Unmute' : 'Mute'}
          onclick={() => props.mediaService.setMuted(!isMuted)}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Icon icon={getVolumeIcon()} />
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? '0' : volume.toString()}
          oninput={(ev) => {
            const target = ev.currentTarget as HTMLInputElement
            const val = parseFloat(target.value)
            if (!isNaN(val)) {
              if (val > 0 && isMuted) {
                props.mediaService.setMuted(false)
              }
              props.mediaService.setVolume(val)
            }
          }}
        />
      </>
    )
  },
})
