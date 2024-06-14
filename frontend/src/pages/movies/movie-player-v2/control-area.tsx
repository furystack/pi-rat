import { Shade, createComponent } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'

type ControlAreaProps = {
  isPlaying: ObservableValue<boolean>
  onPlay?: () => void
  onPause?: () => void
  onFullScreen?: () => void
}

export const ControlArea = Shade<ControlAreaProps>({
  shadowDomName: 'pirat-movie-player-v2-control-area',
  render: ({ props, useObservable }) => {
    const [isPlaying] = useObservable('isPlaying', props.isPlaying)
    return (
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          background: 'darkblue',
          width: '100%',
          height: '3em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {isPlaying ? <Button onclick={props.onPause}>⏸️</Button> : <Button onclick={props.onPlay}>▶️</Button>}
        <Button onclick={props.onFullScreen}>🎞️</Button>
      </div>
    )
  },
})
