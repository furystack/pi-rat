import { Shade, createComponent, styledShade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'

type ControlAreaProps = {
  isPlaying: ObservableValue<boolean>
  onPlay?: () => void
  onPause?: () => void
  onFullScreen?: () => void
}

const ControlButton = styledShade(Button, {
  fontSize: '2em',
  padding: '.3em 1em',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: '100%',
})

export const ControlArea = Shade<ControlAreaProps>({
  shadowDomName: 'pirat-movie-player-v2-control-area',
  render: ({ props, useObservable }) => {
    const [isPlaying] = useObservable('isPlaying', props.isPlaying)
    return (
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0) 100%)',
          width: '100%',
          height: '4em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '2147483647',
        }}>
        {isPlaying ? (
          <ControlButton title="Pause" onclick={props.onPause}>
            &#x23f8;
          </ControlButton>
        ) : (
          <ControlButton title="Play" onclick={props.onPlay}>
            &#9654;
          </ControlButton>
        )}
        <ControlButton title="Toggle full screen" onclick={props.onFullScreen}>
          &#x26F6;
        </ControlButton>
      </div>
    )
  },
})
