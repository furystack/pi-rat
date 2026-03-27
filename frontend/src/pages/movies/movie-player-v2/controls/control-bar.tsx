import type { RefObject } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'

import type { MoviePlayerService } from '../movie-player-service.js'
import { CaptionsButton } from './captions-button.js'
import { FullscreenButton } from './fullscreen-button.js'
import { PipButton } from './pip-button.js'
import { PlayButton } from './play-button.js'
import { SeekBar } from './seek-bar.js'
import { SettingsMenu } from './settings-menu.js'
import { TimeDisplay } from './time-display.js'
import { VolumeControl } from './volume-control.js'

type ControlBarProps = {
  mediaService: MoviePlayerService
  playerContainerRef: RefObject<HTMLElement>
}

export const ControlBar = Shade<ControlBarProps>({
  customElementName: 'pirat-player-control-bar',
  css: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    background: `linear-gradient(transparent, ${cssVariableTheme.background.paper})`,
    color: cssVariableTheme.text.primary,
    width: '100%',
    boxSizing: 'border-box',
  },
  render: ({ props }) => {
    return (
      <>
        <PlayButton mediaService={props.mediaService} />
        <TimeDisplay mediaService={props.mediaService} />
        <SeekBar mediaService={props.mediaService} />
        <VolumeControl mediaService={props.mediaService} />
        <CaptionsButton mediaService={props.mediaService} />
        <PipButton mediaService={props.mediaService} />
        <FullscreenButton mediaService={props.mediaService} playerContainerRef={props.playerContainerRef} />
        <SettingsMenu mediaService={props.mediaService} />
      </>
    )
  },
})
