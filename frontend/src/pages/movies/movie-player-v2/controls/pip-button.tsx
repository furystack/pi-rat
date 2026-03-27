import { Shade, createComponent } from '@furystack/shades'
import { Icon } from '@furystack/shades-common-components'

import type { MoviePlayerService } from '../movie-player-service.js'
import { pipIcon } from './player-icons.js'

type PipButtonProps = {
  mediaService: MoviePlayerService
}

export const PipButton = Shade<PipButtonProps>({
  customElementName: 'pirat-player-pip-button',
  render: ({ props }) => {
    return (
      <button
        type="button"
        data-testid="pip-button"
        title="Picture in Picture"
        onclick={() => props.mediaService.togglePip()}
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
        <Icon icon={pipIcon} />
      </button>
    )
  },
})
