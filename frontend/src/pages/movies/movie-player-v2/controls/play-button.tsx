import { Shade, createComponent } from '@furystack/shades'
import { Icon, icons } from '@furystack/shades-common-components'

import type { MoviePlayerService } from '../movie-player-service.js'

type PlayButtonProps = {
  mediaService: MoviePlayerService
}

export const PlayButton = Shade<PlayButtonProps>({
  customElementName: 'pirat-player-play-button',
  render: ({ props, useObservable }) => {
    const [isPlaying] = useObservable('isPlaying', props.mediaService.isPlaying)

    return (
      <button
        type="button"
        data-testid="play-button"
        title={isPlaying ? 'Pause' : 'Play'}
        onclick={() => props.mediaService.togglePlay()}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon={isPlaying ? icons.pause : icons.play} />
      </button>
    )
  },
})
