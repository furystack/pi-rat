import type { RefObject } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { Icon } from '@furystack/shades-common-components'

import type { MoviePlayerService } from '../movie-player-service.js'
import { fullscreenEnterIcon, fullscreenExitIcon } from './player-icons.js'

type FullscreenButtonProps = {
  mediaService: MoviePlayerService
  playerContainerRef: RefObject<HTMLElement>
}

export const FullscreenButton = Shade<FullscreenButtonProps>({
  customElementName: 'pirat-player-fullscreen-button',
  render: ({ props, useObservable }) => {
    const [isFullscreen] = useObservable('isFullscreen', props.mediaService.isFullscreen)

    return (
      <button
        type="button"
        data-testid="fullscreen-button"
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        onclick={() => {
          if (props.playerContainerRef.current) {
            props.mediaService.toggleFullscreen(props.playerContainerRef.current)
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
        }}
      >
        <Icon icon={isFullscreen ? fullscreenExitIcon : fullscreenEnterIcon} />
      </button>
    )
  },
})
